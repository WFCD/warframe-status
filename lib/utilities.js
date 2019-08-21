'use strict';

require('colors');
const ah = require('express-async-handler');
const warframeData = require('warframe-worldstate-data');
const Items = require('warframe-items');

const { transports, createLogger, format } = require('winston');
const apiCache = require('apicache');

const Cache = require('json-fetch-cache');
const WSCache = require('./caches/WSCache');

const platforms = ['pc', 'ps4', 'xb1', 'swi'];
const platformAliases = ['ns'];
const worldStates = {};

const {
  combine, label, printf, colorize,
} = format;

/**
 * Group an array by a field value
 * @param  {Object[]} array array of objects to broup
 * @param  {string} field field to group by
 * @returns {Object}       [description]
 */
const groupBy = (array, field) => {
  const grouped = {};
  if (!array) return undefined;
  array.forEach((item) => {
    const fVal = item[field];
    if (!grouped[fVal]) {
      grouped[fVal] = [];
    }
    grouped[fVal].push(item);
  });
  return grouped;
};

/* Logger setup */
const transport = new transports.Console({ colorize: true });
const logFormat = printf(info => `[${info.label}] ${info.level}: ${info.message}`);
const logger = createLogger({
  format: combine(
    colorize(),
    label({ label: 'REST'.cyan }),
    logFormat,
  ),
  transports: [transport],
});
logger.level = process.env.LOG_LEVEL || 'error';

const socketLogger = createLogger({
  format: combine(
    colorize(),
    label({ label: 'SOCK'.purple }),
    logFormat,
  ),
  transports: [transport],
});
socketLogger.level = process.env.LOG_LEVEL || 'error';

/* Warframe Data & Keys */
delete warframeData.weapons;
delete warframeData.warframes;

const kuvaCache = new Cache('https://10o.io/kuvalog.json', 300000, {
  useEmitter: false, logger, delayStart: false, maxRetry: 1,
});

const wsTimeout = process.env.CACHE_TIMEOUT || 60000;
const wsRawCaches = {};

platforms.forEach((p) => {
  const url = `http://content${p === 'pc' ? '' : `.${p}`}.warframe.com/dynamic/worldState.php`;
  worldStates[p] = {};

  warframeData.locales.forEach((locale) => {
    worldStates[p][locale] = new WSCache(p, locale, kuvaCache);
  });
  wsRawCaches[p] = new Cache(url, wsTimeout, {
    delayStart: false,
    parser: str => str,
    useEmitter: true,
    logger,
  });
  wsRawCaches[p].on('update', (dataStr) => {
    warframeData.locales.forEach((locale) => {
      worldStates[p][locale].data = dataStr;
    });
  });
});

const titleCase = str => str.toLowerCase().replace(/\b\w/g, l => l.toUpperCase());

module.exports = {
  setHeadersAndJson: (res, json) => {
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'DNT,X-CustomHeader,Keep-Alive,User-Agent,X-Requested-With,If-Modified-Since,Cache-Control,Content-Type,Content-Range,Range');
    res.setHeader('Access-Control-Expose-Headers', 'DNT,X-CustomHeader,Keep-Alive,User-Agent,X-Requested-With,If-Modified-Since,Cache-Control,Content-Type,Content-Range,Range');
    res.json(json);
  },
  logger,
  platforms,
  platformAliases,
  cache: apiCache.options({
    appendKey: req => `${req.platform}${req.language}` || '',
  }).middleware,
  Items,
  warframeData,
  solKeys: Object.keys(warframeData.solNodes),
  worldStates,
  ah,
  titleCase,
  socketLogger,
  groupBy,
  languages: warframeData.locales,
};
