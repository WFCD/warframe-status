'use strict';

/* eslint-disable import/no-unresolved */
const express = require('express');
const helmet = require('helmet');
const logger = require('winston');
const Worldstate = require('warframe-worldstate-parser');
const warframeData = require('warframe-worldstate-data'); // eslint-disable-line import/no-unresolved
const Cache = require('./lib/cache.js');
const DropCache = require('./lib/DropCache.js');
const asyncHandler = require('express-async-handler');
/* eslint-enable import/no-unresolved */


logger.level = process.env.LOG_LEVEL || 'error';

const parser = function parser(data) {
  return new Worldstate(data);
};

const dropCache = new DropCache(logger);

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

const setHeadersAndJson = (res, json) => {
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'DNT,X-CustomHeader,Keep-Alive,User-Agent,X-Requested-With,If-Modified-Since,Cache-Control,Content-Type,Content-Range,Range');
  res.setHeader('Access-Control-Expose-Headers', 'DNT,X-CustomHeader,Keep-Alive,User-Agent,X-Requested-With,If-Modified-Since,Cache-Control,Content-Type,Content-Range,Range');
  res.json(json);
};

const handleSearch = async (key, query) => {
  let values = [];
  let results = [];
  let keyResults = [];
  const nodeResults = [];
  const queries = query.split(',').map(q => q.trim());
  let dropData;
  if (key === 'drops') {
    dropData = await dropCache.getData();
  }

  queries.forEach((q) => {
    const loweredQuery = q.toLowerCase();
    let value;
    switch (key) {
      case 'arcanes':
        results = warframeData.arcanes
          .filter(arcanes => (new RegExp(arcanes.regex)).test(loweredQuery)
            || arcanes.name.toLowerCase().includes(loweredQuery.toLowerCase()));
        value = results.length > 0 ? results : [];
        break;
      case 'drops':
        results = dropData.filter(drop => drop.place.toLowerCase().includes(loweredQuery)
          || drop.item.toLowerCase().includes(loweredQuery));
        value = results.length > 0 ? results : [];
        break;
      case 'warframes':
        results = warframeData.warframes
          .filter(frame => (new RegExp(frame.regex)).test(loweredQuery)
            || frame.name.toLowerCase().includes(loweredQuery));
        value = results.length > 0 ? results : [];
        break;
      case 'weapons':
        results = warframeData.weapons
          .filter(weapon => (new RegExp(weapon.regex)).test(loweredQuery)
            || weapon.name.toLowerCase().includes(loweredQuery));
        value = results.length > 0 ? results : [];
        break;
      case 'tutorials':
        results = warframeData.tutorials
          .filter(tutorial => (new RegExp(tutorial.regex)).test(loweredQuery)
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
            values[0].keys = values[0].keys.concat(keyResults);
          }
          if (values[0].nodes) {
            values[0].nodes = values[0].nodes.concat(nodeResults);
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
    if (value) {
      values = values.concat(value);
    }
  });

  if (key === 'solNodes' && values[0]) {
    values[0] = {
      keys: Array.from(new Set(values[0].keys)),
      nodes: Array.from(new Set(values[0].nodes)),
    };
  }
  return values;
};

platforms.forEach((p) => {
  const url = `http://content${p === 'pc' ? '' : `.${p}`}.warframe.com/dynamic/worldState.php`;
  worldStates[p] = new Cache(url, process.env.CACHE_TIMEOUT || 60000, { parser });
  worldStates[p].startUpdating();
});

const app = express();
app.use(helmet());

app.get('/:key', asyncHandler(async (req, res) => {
  logger.log('silly', `Got ${req.originalUrl}`);
  // platform
  if (platforms.includes(req.params.key.toLowerCase())) {
    logger.log('debug', 'Worldstate Data Retrieval');
    try {
      const data = await worldStates[req.params.key.toLowerCase()].getData();
      setHeadersAndJson(res, data);
    } catch (e) {
      logger.error(e);
    }
  // all drops
  } else if (req.params.key === 'drops') {
    setHeadersAndJson(res, await await dropCache.getData());
  // data keys
  } else if (wfKeys.includes(req.params.key)) {
    logger.log('debug', 'Generic Data Retrieval');
    if (!req.query.search) {
      setHeadersAndJson(res, warframeData[req.params.key]);
    } else {
      logger.log('debug', 'Generic Data Retrieval');
      setHeadersAndJson(res, await handleSearch(req.params.key, req.query.search.trim()));
    }
  // routes listing
  } else if (req.params.key === 'routes') {
    setHeadersAndJson(res, [].concat(wfKeys).concat(platforms));
  } else {
    res.status(404).end();
  }
}));

// worldstate data section
app.get('/:platform/:item', (req, res) => {
  logger.log('silly', `Got ${req.originalUrl}`);
  if (!platforms.includes(req.params.platform) || !items.includes(req.params.item)) {
    res.status(404).end();
    return;
  }
  worldStates[req.params.platform].getData().then((data) => {
    setHeadersAndJson(res, data[req.params.item]);
  }).catch(logger.error);
});

// Search via query key
app.get('/:key/search/:query', asyncHandler(async (req, res) => {
  logger.log('silly', `Got ${req.originalUrl}`);
  if (!wfKeys.includes(req.params.key)) {
    res.status(404).end();
    return;
  }
  logger.log('debug', 'Generic Data Retrieval - Search');
  setHeadersAndJson(res, await handleSearch(req.params.key, req.params.query.trim()));
}));

// oh no, nothing
app.use((req, res) => {
  res.status(404).end();
});

app.listen(process.env.PORT || 3000, process.env.HOSTNAME || '127.0.0.1');
