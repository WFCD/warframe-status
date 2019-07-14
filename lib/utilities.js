'use strict';

const ah = require('express-async-handler');
const warframeData = require('warframe-worldstate-data');
const Items = require('warframe-items');
const Worldstate = require('warframe-worldstate-parser');

const { transports, createLogger, format } = require('winston');
const apiCache = require('apicache');

const Cache = require('./caches/cache.js');

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
    label({ label: 'REST' }),
    logFormat,
  ),
  transports: [transport],
});
logger.level = process.env.LOG_LEVEL || 'info';

const socketLogger = createLogger({
  format: combine(
    colorize(),
    label({ label: 'SOCK' }),
    logFormat,
  ),
  transports: [transport],
});
socketLogger.level = process.env.LOG_LEVEL || 'info';

/* Warframe Data & Keys */
delete warframeData.weapons;
delete warframeData.warframes;

const parser = function parser(data) {
  return new Worldstate(data);
};

const kuvaCache = new Cache('https://10o.io/kuvalog.json', 300000, {useEmitter: false, parser: kParser });

const wsTimeout = process.env.CACHE_TIMEOUT || 60000;

platforms.forEach((p) => {
  const url = `http://content${p === 'pc' ? '' : `.${p}`}.warframe.com/dynamic/worldState.php`;
  worldStates[p] = {};
  warframeData.locales.forEach((locale) => {
    worldStates[p][locale] = new Cache(url, wsTimeout, {
      parser, logger, delayStart: locale !== 'en', opts: [{ locale, kuvaCache }],
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
    appendKey: req => req.platform || '',
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
