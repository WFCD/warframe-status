import 'colors';
import asyncHandler from 'express-async-handler';
import wfData from 'warframe-worldstate-data';
import wfItems from '@wfcd/items';
import WorldStateEmitter from 'worldstate-emitter';
import apiCache from 'apicache';

import initLogger from './logger.js';

export const platforms = ['pc', 'ps4', 'xb1', 'swi'];
export const platformAliases = ['ns'];

// Note: other worldstates have been synced into pc
//    and all default to pc in src/controllers/worldstate.js
export const worldState = await WorldStateEmitter.make();

/**
 * Trim down to the first path route
 * @param {string} path full path to trim
 * @returns {string}
 */
export const trimPlatform = (path) => (path.replace('/', '').trim().split('/')[0] || '').toLowerCase();

/**
 * Group an array by a field value
 * @param  {Object[]} array array of objects to group
 * @param  {string} field field to group by
 * @returns {Object}       [description]
 */
export const groupBy = (array, field) => {
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
export const logger = initLogger('REST');

export const socketLogger = initLogger('SOCK');

/* Warframe Data & Keys */
delete wfData.weapons;
delete wfData.warframes;

export const titleCase = (str) => str.toLowerCase().replace(/\b\w/g, (l) => l.toUpperCase());

export const noResult = (res) => {
  res.status(404).json({ error: 'No Result', code: 404 });
};

export const appendKey = (req) => {
  const queries = Object.keys(req.query).map((q) => `${q}${req.query[q]}`);
  return (
    `${req.method}${encodeURIComponent(req.path)}${req.platform || ''}${req.language || 'en'}${queries.join('')}` || ''
  );
};

export const solKeys = Object.keys(wfData.solNodes);
export const languages = wfData.locales;

export const cache = apiCache.options({
  appendKey,
  enabled: process.env.NODE_ENV === 'production',
  statusCodes: {
    exclude: [503],
  },
  respectCacheControl: true,
}).middleware;

export const warframeData = wfData;
export const Items = wfItems;
export const ah = asyncHandler;
