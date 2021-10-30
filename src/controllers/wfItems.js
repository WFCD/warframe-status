'use strict';

const express = require('express');

const router = express.Router();

const {
  Items, logger, noResult, trimPlatform, cache, languages: i18n,
} = require('../lib/utilities');

const i18nOnObject = true;
const wfItemData = {
  weapons: new Items({ category: ['Primary', 'Secondary', 'Melee', 'Arch-Melee', 'Arch-Gun'], i18n, i18nOnObject }),
  warframes: new Items({ category: ['Warframes', 'Archwing'], i18n, i18nOnObject }),
  items: new Items({ i18n, i18nOnObject }),
  mods: new Items({ category: ['Mods'], i18n, i18nOnObject }),
};
const cleanup = (item, lang) => {
  if (lang) {
    if (lang !== 'en') {
      Object.keys(item.i18n).forEach((locale) => {
        if (locale !== lang) item.i18n[locale] = undefined;
      });
    } else {
      item.i18n = undefined;
    }
  }
  return item;
};
const postCleanup = (item, { only, remove }) => {
  const removeKeys = (remove || '').split(',');
  const onlyKeys = (only || '').split(',');
  if (Array.isArray(onlyKeys) && onlyKeys.length) {
    Object.keys(item).forEach((key) => {
      if (!onlyKeys.includes(key)) {
        item[key] = undefined;
      }
    });
  } else if (Array.isArray(removeKeys)) {
    removeKeys.forEach((key) => {
      item[key] = undefined;
    });
  }
  return item;
};

router.use((req, res, next) => {
  req.platform = trimPlatform(req.baseUrl);
  req.items = (req.baseUrl.replace('/', '').trim().split('/')[0] || '').toLowerCase();
  if (Object.keys(wfItemData).includes(req.items)) {
    req.items = [...wfItemData[req.items]].map((i) => cleanup(i, req.header('Accept-Language')));
    res.setHeader('Content-Language', req.header('Accept-Language'));
  }
  next();
});

/**
 * GET /warframes
 * @summary Get Warframe specs and data, such as polarities defenses, and profile.
 * @description Warframe stats and general information.
 * @tags Static Processing Data
 * @return {Array<Item>} 200 - successful operation
 */
/**
 * GET /weapons
 * @summary Get Weapon data and statistics.
 * @description Weapon statistics.
 * @tags Static Processing Data
 * @return {Array<Item>} 200 - successful operation
 */
/**
 * GET /items
 * @summary Get Warframe specs and data, such as polarities defenses, and profile.
 * @description Warframe stats and general information.
 * @tags Static Processing Data
 * @return {Array<Item>} 200 - successful operation
 */
/**
 * GET /mods
 * @summary Get Warframe specs and data, such as polarities defenses, and profile.
 * @description Warframe stats and general information.
 * @tags Static Processing Data
 * @return {Array<Item>} 200 - successful operation
 */
router.get('/', (req, res) => {
  logger.silly(`Got ${req.originalUrl}`);
  const { remove, only } = req.query;

  res.json([...req.items].map((i) => postCleanup(i, { only, remove })));
});

/**
 * GET /warframes/{query}
 * @summary Get Warframe specs and data, such as polarities defenses, and profile based on the query
 * @description Warframe stats and general information.
 * @tags Searchable
 * @param {string} query.path - Keyword to search for
 * @return {Item} 200 - successful operation
 */
/**
 * GET /weapons/{query}
 * @summary Get Weapon data and statistics based on the query.
 * @description Weapon Statistics
 * @tags Searchable
 * @param {string} query.path - Keyword to search for
 * @return {Item} 200 - successful operation
 */
/**
 * GET /items/{query}
 * @summary Get Warframe Items data
 * @description Item information, such as name, unique name, type, and image name.
 * @tags Searchable
 * @param {string} query.path - Keyword to search for
 * @return {Item} 200 - successful operation
 */
/**
 * GET /mods/{query}
 * @summary Get Mods Items data
 * @description Mod information
 * @tags Searchable
 * @param {string} query.path - Keyword to search for
 * @return {Array<Item>} 200 - successful operation
 */
router.get('/:item', cache('10 hours'), (req, res, next) => {
  logger.silly(`Got ${req.originalUrl}`);
  const { remove, only } = req.query;
  let result;
  let exact = false;
  req.items.forEach((item) => {
    if (item.name.toLowerCase() === req.params.item.toLowerCase()) {
      result = item;
      exact = true;
    }
    if (item.name.toLowerCase().includes(req.params.item.toLowerCase()) && !exact) {
      result = item;
    }
  });
  if (result) {
    res.json(postCleanup(result, { only, remove }));
  } else {
    noResult(res);
  }
  next();
});

/**
 * GET /warframes/search/{query}
 * @summary Get Warframe specs and data, such as polarities defenses, and profile based on the query
 * @description Warframe stats and general information.
 * @tags Searchable
 * @param {string} query.path - Keyword to search for
 * @return {Array<Item>} 200 - successful operation
 */
/**
 * GET /weapons/search/{query}
 * @summary Get Weapon data and statistics based on the query.
 * @description Weapon Statistics
 * @tags Searchable
 * @param {string} query.path - Keyword to search for
 * @return {Array<Item>} 200 - successful operation
 */
/**
 * GET /items/search/{query}
 * @summary Get Warframe Items data
 * @description Item information, such as name, unique name, type, and image name.
 * @tags Searchable
 * @param {string} query.path - Keyword to search for
 * @return {Array<Item>} 200 - successful operation
 */
/**
 * GET /mods/search/{query}
 * @summary Get Mods Items data
 * @description Mod information
 * @tags Searchable
 * @param {string} query.path - Keyword to search for
 * @return {Array<Item>} 200 - successful operation
 */
router.get('/search/:query', cache('10 hours'), (req, res) => {
  logger.silly(`Got ${req.originalUrl}`);
  const { remove, only } = req.query;
  const queries = req.params.query.trim().split(',').map((q) => q.trim().toLowerCase());
  const results = queries.map((query) => [...req.items].map((item) => {
    if (item.name.toLowerCase().includes(query)) {
      return item;
    }
    return null;
  }).filter((a) => a)).flat();
  res.json(Array.from(new Set(results)).map((i) => postCleanup(i, { only, remove })));
});

module.exports = router;
