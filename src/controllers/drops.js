import express from 'express';

import { cache, ah } from '../lib/utilities.js';
import DropsCache from '../lib/caches/Drops.js';

const router = express.Router();

/**
 * Drop with chances @ location
 * @typedef {Object} Drop
 * @property {string} location
 * @property {string} type
 * @property {('common'|'uncommon'|'rare'|'legendary')} [rarity]
 * @property {number} [chance] drop chance as a decimal that the drop occurs
 * @property {'A'|'B'|'C'|'D'|'E'|'F'|'G'} [rotation] rotation the drop occurs on
 */

/**
 * GET /drops
 * @return {Array<Drop>} drop array
 * @summary Drops, responses are cached for 24h
 * @description Get all of the drops
 */
router.get(
  '/',
  cache('24 hours'),
  ah(async (req, res) => {
    res.json(await DropsCache.get());
  })
);

/**
 * GET /drops/search/{query}
 * @param {string} query.path Drop query
 * @return {Array<Drop>} qualifying drop array
 * @summary Responds with an array of drops matching the query.
 * @description Query-based drop search, responses are cached for an hour
 */
router.get(
  ['/search/:query/', '/search/:query'],
  cache('1 hour'),
  ah(async (req, res) => {
    const drops = await DropsCache.get({ term: req.params.query, groupedBy: req.query.grouped_by });
    res.json(drops);
  })
);

export default router;
