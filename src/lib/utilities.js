'use strict';

require('colors');
const ah = require('express-async-handler');
const warframeData = require('warframe-worldstate-data');
const Items = require('warframe-items');
const WorldstateEmitter = require('worldstate-emitter');
const apiCache = require('apicache');

const initLogger = require('./logger');

const platforms = ['pc', 'ps4', 'xb1', 'swi'];
const platformAliases = ['ns'];

const worldState = new WorldstateEmitter();

const trimPlatform = (path) => (path.replace('/', '').trim().split('/')[0] || '').toLowerCase();

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
const logger = initLogger('REST');

const socketLogger = initLogger('SOCK');

/* Warframe Data & Keys */
delete warframeData.weapons;
delete warframeData.warframes;

const titleCase = (str) => str.toLowerCase().replace(/\b\w/g, (l) => l.toUpperCase());

const noResult = (res) => {
  res.status(400).json({ error: 'No Result.', code: 400 });
};

const appendKey = (req) => {
  const queries = Object.keys(req.query).map((q) => `${q}${req.query[q]}`);
  return `${req.platform || ''}${req.language || 'en'}${queries.join('&')}` || '';
};

module.exports = {
  logger,
  platforms,
  platformAliases,
  cache: apiCache.options({
    appendKey,
  }).middleware,
  Items,
  warframeData,
  solKeys: Object.keys(warframeData.solNodes),
  ah,
  titleCase,
  socketLogger,
  groupBy,
  languages: warframeData.locales,
  worldState,
  noResult,
  trimPlatform,
};
