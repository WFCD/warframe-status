'use strict';

const express = require('express');
const helmet = require('helmet');
const winston = require('winston');
const Worldstate = require('warframe-worldstate-parser');
const warframeData = require('warframe-worldstate-data'); // eslint-disable-line import/no-unresolved
const Cache = require('./lib/cache.js');

winston.level = process.env.LOG_LEVEL || 'error';

const parser = function parser(data) {
  return new Worldstate(data);
};

const platforms = ['pc', 'ps4', 'xb1'];
const items = [
  'news',
  'events',
  'alerts',
  'sortie',
  'syndicateMissions',
  'fissures',
  'globalUpgrades',
  'flashSales',
  'invasions',
  'darkSectors',
  'voidTrader',
  'dailyDeals',
  'simaris',
  'conclaveChallenges',
  'persistentEnemies',
  'cetusCycle',
  'constructionProgress',
  'earthCycle',
  'timestamp',
];

const wfKeys = Object.keys(warframeData);
const solKeys = Object.keys(warframeData.solNodes);
const worldStates = {};

const handleSearch = (key, query) => {
  let value = {};
  let results = [];
  let keyResults = [];
  let nodeResults = [];
  
  switch (key) {
    case 'warframes':
      results = warframeData.warframes.filter(frame => (new RegExp(frame.regex)).test(query));
      value = results.length > 0 ? results : {};
      break;
    case 'solNodes':
      keyResults = solKeys
        .filter(solNodeKey => solNodeKey.toLowerCase().includes(query.toLowerCase()));
      solKeys.forEach((solKey) => {
        if (warframeData.solNodes[solKey]
          && warframeData.solNodes[solKey].value.toLowerCase().includes(query.toLowerCase())) {
          nodeResults.push(warframeData.solNodes[solKey]);
        }
      });
      value = { keys: keyResults, nodes: nodeResults };
      break;
    default:
      Object.keys(warframeData[key]).forEach((selectedDataKey) => {
        if (selectedDataKey.toLowerCase().includes(query.toLowerCase())) {
          results.push(warframeData[key][selectedDataKey]);
        }
      });
      value = results;
      break;
  }
  return value;
};

platforms.forEach((p) => {
  const url = `http://content${p === 'pc' ? '' : `.${p}`}.warframe.com/dynamic/worldState.php`;
  worldStates[p] = new Cache(url, process.env.CACHE_TIMEOUT || 60000, { parser });
  worldStates[p].startUpdating();
});

const app = express();
app.use(helmet());

/* don't redirect for now
app.get('/', (req, res) => {
  res.redirect('/pc');
});
*/

app.get('/:key', (req, res) => {
  winston.log('silly', `Got ${req.originalUrl}`);
  if (platforms.includes(req.params.key)) {
    winston.info('Worldstate Data Retrieval');
    worldStates[req.params.key].getData().then((data) => {
      res.json(data);
    }).catch(winston.error);
  } else if (wfKeys.includes(req.params.key)) {
    winston.log('debug', 'Generic Data Retrieval');
    if (!req.query.search) {
      res.json(warframeData[req.params.key]);
    } else {
      winston.log('debug', 'Generic Data Retrieval');
      res.json(handleSearch(req.params.key, req.query.search.trim()));
    }
  } else {
    res.status(404).end();
    return;
  }
});

app.get('/:platform/:item', (req, res) => {
  winston.log('silly', `Got ${req.originalUrl}`);
  if (!platforms.includes(req.params.platform) || !items.includes(req.params.item)) {
    res.status(404).end();
    return;
  }
  worldStates[req.params.platform].getData().then((data) => {
    res.json(data[req.params.item]);
  }).catch(winston.error);
});

app.use((req, res) => {
  res.status(404).end();
});

app.listen(process.env.PORT || 3000, process.env.HOSTNAME || '127.0.0.1');
