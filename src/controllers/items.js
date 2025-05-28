import express from 'express';

import { noResult, trimPlatform, cache, ah } from '../lib/utilities.js';
import Items from '../lib/caches/Items.js';

const router = express.Router();
const splitKeys = (input) => (input || '').split(',').filter(Boolean);
const splitFilter = (input) =>
  (input || '')
    .split(',')
    .filter(Boolean)
    .map((i) => {
      const [key, value] = i.split(':');
      return { key, value };
    });

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
router.get(
  '/',
  ah(async (req, res) => {
    const { remove, only, filter } = req.query;
    return res.status(200).json(
      await Items.get(req.itemType, req.language, {
        remove: splitKeys(remove),
        only: splitKeys(only),
        filter: splitFilter(filter),
      })
    );
  })
);

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
router.get(
  ['/:item/', '/:item'],
  cache('10 hours'),
  ah(async (req, res) => {
    const { remove, only, filter, by } = req.query;
    const result = await Items.get(req.itemType, req.language, {
      by,
      only: splitKeys(only),
      remove: splitKeys(remove),
      filter: splitFilter(filter),
      max: 1,
      term: req.params.item,
    });

    if (result && Object.keys(result).length) {
      return res.status(200).json(result);
    }
    return noResult(res);
  })
);

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
router.get(
  ['/search/:query/', '/search/:query'],
  cache('10 hours'),
  ah(async (req, res) => {
    const { remove, only, by = 'name', filter } = req.query;
    const queries = req.params.query
      .trim()
      .split(',')
      .map((q) => q.trim().toLowerCase());
    const results = [];
    for await (const query of queries) {
      results.push(
        await Items.get(req.itemType, req.language, {
          by,
          remove: splitKeys(remove),
          only: splitKeys(only),
          term: query,
          max: 0,
          filter: splitFilter(filter),
        })
      );
    }
    return res.status(200).json(results.flat());
  })
);

export default router;
