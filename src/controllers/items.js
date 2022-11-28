'use strict';

const express = require('express');

const router = express.Router();

const { logger, noResult, trimPlatform, cache } = require('../lib/utilities');

const Items = require('../lib/caches/Items');

const splitKeys = (input) => (input || '').split(',').filter((k) => k.length);

router.use((req, res, next) => {
  req.itemType = trimPlatform(req.baseUrl);
  res.setHeader('Content-Language', req.language);
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
  return res.status(200).json(
    Items.get(req.itemType, req.language, {
      remove: splitKeys(remove),
      only: splitKeys(only),
    })
  );
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
router.get('/:item/?', cache('10 hours'), (req, res) => {
  logger.silly(`Got ${req.originalUrl}`);
  const { remove, only } = req.query;
  const result = Items.get(req.itemType, req.language, {
    by: req.query.by,
    only: splitKeys(only),
    remove: splitKeys(remove),
    max: 1,
    term: req.params.item,
  });

  if (result && Object.keys(result).length) {
    return res.status(200).json(result);
  }
  return noResult(res);
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
router.get('/search/:query/?', cache('10 hours'), (req, res) => {
  logger.silly(`Got ${req.originalUrl}`);
  const { remove, only, by = 'name' } = req.query;
  const queries = req.params.query
    .trim()
    .split(',')
    .map((q) => q.trim().toLowerCase());
  const results = queries
    .map((query) =>
      Items.get(req.itemType, req.language, {
        by,
        remove: splitKeys(remove),
        only: splitKeys(only),
        term: query,
        max: 0,
      })
    )
    .flat();
  return res.status(200).json(results);
});

module.exports = router;
