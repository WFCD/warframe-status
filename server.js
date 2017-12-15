'use strict';

const express = require('express');
const helmet = require('helmet');
const winston = require('winston');
const Worldstate = require('warframe-worldstate-parser');
const warframeData = require('warframe-worldstate-data'); // eslint-disable-line import/no-unresolved
const Cache = require('./lib/cache.js');
const DropCache = require('./lib/DropCache.js');
const asyncHandler = require('express-async-handler');

winston.level = process.env.LOG_LEVEL || 'error';

const parser = function parser(data) {
  return new Worldstate(data);
};

const dropCache = new DropCache(winston);

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
wfKeys.push('drops');
const solKeys = Object.keys(warframeData.solNodes);
const worldStates = {};

const handleSearch = async (key, query) => {
  let values = [];
  let results = [];
  let keyResults = [];
  const nodeResults = [];
  const queries = query.split(',').map(q => q.trim());
  let dropData;
  if(key === 'drops') {
    dropData = await dropCache.getData();
  }

  queries.forEach((q) => {
    const loweredQuery = q.toLowerCase();
    let value;
    switch (key) {
      case 'arcanes':
        results = warframeData.arcanes.filter(arcanes => (new RegExp(arcanes.regex)).test(loweredQuery)
            || arcanes.name.toLowerCase().includes(loweredQuery.toLowerCase()));
        value = results.length > 0 ? results : [];
        break;
      case 'drops':
        results = dropData.filter(drop => drop.place.toLowerCase().includes(loweredQuery)
          || drop.item.toLowerCase().includes(loweredQuery))
        value = results.length > 0 ? results : [];
        break;
      case 'warframes':
        results = warframeData.warframes.filter(frame => (new RegExp(frame.regex)).test(loweredQuery)
          || frame.name.toLowerCase().includes(loweredQuery));
        value = results.length > 0 ? results : [];
        break;
      case 'weapons':
        results = warframeData.weapons.filter(weapon => (new RegExp(weapon.regex)).test(loweredQuery)
          || weapon.name.toLowerCase().includes(loweredQuery));
        value = results.length > 0 ? results : [];
        break;
      case 'tutorials':
        results = warframeData.tutorials.filter(tutorial => (new RegExp(tutorial.regex)).test(loweredQuery)
            || tutorial.name.toLowerCase().includes(loweredQuery));
        value = results.length > 0 ? results : [];
        break;
      case 'solNodes':
        keyResults = solKeys
          .filter(solNodeKey => solNodeKey.toLowerCase().includes(loweredQuery));
        solKeys.forEach((solKey) => {
          if (warframeData.solNodes[solKey]
            && warframeData.solNodes[solKey].value.toLowerCase().includes(loweredQuery)) {
            nodeResults.push(warframeData.solNodes[solKey]);
          }
        });
        if (values[0]) {
          if (values[0].keys) {
            value.keys = value.keys.concat(keyResults);
          }
          if (values[0].nodes) {
            value.nodes = value.keys.concat(nodeResults)
          }
        } else {
          // eslint-disable-next-line no-case-declarations
          value = { keys: keyResults, nodes: nodeResults };
        }
        break;
      default:
        Object.keys(warframeData[key]).forEach((selectedDataKey) => {
          if (selectedDataKey.toLowerCase().includes(q.toLowerCase())) {
            results.push(warframeData[key][selectedDataKey]);
          }
        });
        value = results;
        break;
    }
    values = values.concat(value);
  });
  return values;
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

app.get('/:key', asyncHandler(async (req, res) => {
  winston.log('silly', `Got ${req.originalUrl}`);
  if (platforms.includes(req.params.key)) {
    winston.log('debug', 'Worldstate Data Retrieval');
    worldStates[req.params.key].getData().then((data) => {
      res.json(data);
    }).catch(winston.error);
  } else if (wfKeys.includes(req.params.key)) {
    winston.log('debug', 'Generic Data Retrieval');
    if (!req.query.search) {
      res.json(warframeData[req.params.key]);
    } else {
      winston.log('debug', 'Generic Data Retrieval');
      res.json(await handleSearch(req.params.key, req.query.search.trim()));
    }
  } else if (req.params.key === 'routes') {
    res.json([].concat(wfKeys).concat(platforms));
  } else {
    res.status(404).end();
  }
}));

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

app.get('/:key/search/:query', asyncHandler(async (req, res) => {
  winston.log('silly', `Got ${req.originalUrl}`);
  if (!wfKeys.includes(req.params.key)) {
    res.status(404).end();
    return;
  }
  winston.log('debug', 'Generic Data Retrieval - Search');
  res.json(await handleSearch(req.params.key, req.params.query.trim()));
}));

app.use((req, res) => {
  res.status(404).end();
});

app.listen(process.env.PORT || 3000, process.env.HOSTNAME || '127.0.0.1');
