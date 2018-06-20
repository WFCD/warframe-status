'use strict';

/* eslint-disable import/no-unresolved */
const express = require('express');
const helmet = require('helmet');
const winston = require('winston');
const warframeData = require('warframe-worldstate-data'); // eslint-disable-line import/no-unresolved
const DropCache = require('./lib/DropCache.js');
/* eslint-enable import/no-unresolved */

/* Routes */
const Route = require('./lib/Route');
const WorldstateRoute = require('./lib/routes/Worldstate');
const Drops = require('./lib/routes/Drops');
const WorldstateData = require('./lib/routes/WorldstateData');
const Search = require('./lib/routes/Search');
const PriceCheck = require('./lib/routes/PriceCheck');
const TennoTv = require('./lib/routes/TennoTv');

const logger = winston.createLogger();
logger.add(new winston.transports.Console());
logger.level = process.env.LOG_LEVEL || 'error';

const dropCache = new DropCache(logger);

const platforms = ['pc', 'ps4', 'xb1'];

const wfKeys = Object.keys(warframeData);
wfKeys.push('drops');
const solKeys = Object.keys(warframeData.solNodes);

const setHeadersAndJson = (res, json) => {
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'DNT,X-CustomHeader,Keep-Alive,User-Agent,X-Requested-With,If-Modified-Since,Cache-Control,Content-Type,Content-Range,Range');
  res.setHeader('Access-Control-Expose-Headers', 'DNT,X-CustomHeader,Keep-Alive,User-Agent,X-Requested-With,If-Modified-Since,Cache-Control,Content-Type,Content-Range,Range');
  res.json(json);
};

const deps = {
  logger,
  dropCache,
  wfKeys,
  solKeys,
  setHeadersAndJson,
  warframeData,
  platforms,
};

const routes = {
  route: new Route('/', deps),
  worldstate: new WorldstateRoute('/:platform', deps),
  drops: new Drops('/drops', deps),
  data: new WorldstateData('/:key', deps),
  search: new Search('/:key/search/:query', deps),
  priceCheck: new PriceCheck('/pricecheck/:type/:query', deps),
  tennotv: new TennoTv('/tennotv/', deps),
};

const app = express();
app.use(helmet());
app.use(express.json());

app.get('/', (req, res) => {
  logger.log('silly', `Got ${req.originalUrl}`);
  routes.route.handle(req, res);
});

app.all('/tennotv', async (req, res) => {
  await routes.tennotv.handle(req, res, req.method.toLowerCase());
});

app.get('/heartbeat', async (req, res) => {
  res.status(200).json('Success');
});

app.get('/:key', async (req, res) => {
  logger.log('silly', `Got ${req.originalUrl}`);
  // platform
  if (platforms.includes(req.params.key.toLowerCase())) {
    await routes.worldstate.handle(req, res);
  // all drops
  } else if (req.params.key === 'drops') {
    await routes.drops.handle(req, res);
  // data keys
  } else if (wfKeys.includes(req.params.key)) {
    await routes.data.handle(req, res);
  // routes listing
  } else if (req.params.key === 'routes') {
    routes.route.handle(req, res);
  } else {
    res.status(404).end();
  }
});

// worldstate data section
app.get('/:platform/:item', async (req, res) => {
  await routes.worldstate.handle(req, res);
});

// Search via query key
app.get('/:key/search/:query', async (req, res) => {
  await routes.search.handle(req, res);
});

// Pricecheck
app.get('/pricecheck/:type/:query', async (req, res) => {
  await routes.priceCheck.handle(req, res);
});


// oh no, nothing
app.use((req, res) => {
  res.status(404).end();
});

app.listen(process.env.PORT || 3001, process.env.HOSTNAME || '127.0.0.1');
