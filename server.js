'use strict';

/* eslint-disable import/no-unresolved */
const express = require('express');
const helmet = require('helmet');
const { transports, createLogger, format } = require('winston');
const warframeData = require('warframe-worldstate-data'); // eslint-disable-line import/no-unresolved
const apicache = require('apicache');
const DropCache = require('./lib/caches/DropCache.js');

const cache = apicache.middleware;

const {
  combine, label, printf, colorize,
} = format;
/* eslint-enable import/no-unresolved */

/* Routes */
const Route = require('./lib/Route');
const WorldstateRoute = require('./lib/routes/Worldstate');
const Drops = require('./lib/routes/Drops');
const WorldstateData = require('./lib/routes/WorldstateData');
const Search = require('./lib/routes/Search');
const PriceCheck = require('./lib/routes/PriceCheck');
const Weapons = require('./lib/routes/Weapons');
const Warframes = require('./lib/routes/Warframes');
const Mods = require('./lib/routes/Mods');

const transport = new transports.Console({ colorize: true });
const logFormat = printf(info => `[${info.label}] ${info.level}: ${info.message}`);
const logger = createLogger({
  format: combine(
    colorize(),
    label({ label: 'API' }),
    logFormat,
  ),
  transports: [transport],
});
logger.level = process.env.LOG_LEVEL || 'info';

logger.info('Setting up dependencies...');

const dropCache = new DropCache(logger);

const platforms = ['pc', 'ps4', 'xb1'];

delete warframeData.weapons;
delete warframeData.warframes;

const wfKeys = Object.keys(warframeData).map(key => key.toLowerCase());
wfKeys.push('drops', 'mods');
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
  weapons: new Weapons('/weapons/', deps),
  warframes: new Warframes('/warframes/', deps),
  mods: new Mods('/mods/', deps),
};

const app = express();
app.use(helmet());
app.use(express.json());

logger.info('Setting up routes...');
app.get('/', cache('1 minute'), (req, res) => {
  logger.log('silly', `Got ${req.originalUrl}`);
  routes.route.handle(req, res);
});

app.get('/heartbeat', cache('24 hours'), async (req, res) => {
  res.status(200).json('Success');
});

app.get('/warframes', cache('24 hours'), async (req, res) => {
  logger.log('silly', `Got ${req.originalUrl}`);
  routes.warframes.handle(req, res);
});

app.get('/weapons', cache('24 hours'), async (req, res) => {
  logger.log('silly', `Got ${req.originalUrl}`);
  routes.weapons.handle(req, res);
});

app.get('/mods', cache('24 hours'), async (req, res) => {
  logger.log('silly', `Got ${req.originalUrl}`);
  routes.mods.handle(req, res);
});

app.get('/drops', cache('24 hours'), async (req, res) => {
  logger.log('silly', `Got ${req.originalUrl}`);
  routes.drops.handle(req, res);
});

app.get('/:key', cache('1 minute'), async (req, res) => {
  logger.log('silly', `Got ${req.originalUrl}`);
  const key = (req.params.key || '').toLowerCase();
  // platform
  if (platforms.includes(key)) {
    await routes.worldstate.handle(req, res);
  // all drops
  } else if (wfKeys.includes(key)) {
    await routes.data.handle(req, res);
  // routes listing
  } else if (key === 'routes') {
    routes.route.handle(req, res);
  } else {
    res.status(404).end();
  }
});

// worldstate data section
app.get('/:platform/:item', cache('1 minute'), async (req, res) => {
  await routes.worldstate.handle(req, res);
});

// Search via query key
app.get('/:key/search/:query', cache('10 hours'), async (req, res) => {
  await routes.search.handle(req, res);
});

// Pricecheck
app.get('/pricecheck/:type/:query', cache('10 minutes'), async (req, res) => {
  await routes.priceCheck.handle(req, res);
});


// oh no, nothing
app.use((req, res) => {
  res.status(404).end();
});

const port = process.env.PORT || 3001;
const host = process.env.HOSTNAME || process.env.HOST || 'localhost';
app.listen(port, host);

logger.info(`Started listening on ${host}:${port}`);
