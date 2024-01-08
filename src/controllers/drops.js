import express from 'express';
import { cache, ah } from '../lib/utilities.js';
import dropCache from '../lib/caches/Drops.js';

const router = express.Router();

const groupLocation = (data) => {
  const locBase = {};
  data.forEach((reward) => {
    if (!locBase[reward.place]) {
      locBase[reward.place] = {
        rewards: [],
      };
    }
    const slimmed = { ...reward };
    delete slimmed.place;
    locBase[reward.place].rewards.push(slimmed);
  });
  return locBase;
};

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
    res.json(await dropCache.getData());
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
  '/search/:query/?',
  cache('1 hour'),
  ah(async (req, res) => {
    const drops = await dropCache.getData();
    const queries = req.params.query.split(',').map((q) => q.trim());
    let results = [];
    queries.forEach((query) => {
      let qResults = drops.filter(
        (drop) =>
          drop.place.toLowerCase().includes(query.toLowerCase()) ||
          drop.item.toLowerCase().includes(query.toLowerCase())
      );

      qResults = qResults.length > 0 ? qResults : [];

      if (req.query.grouped_by && req.query.grouped_by === 'location') {
        /* istanbul ignore if */ if (typeof results !== 'object') results = {};

        results = {
          ...groupLocation(qResults),
          ...results,
        };
      } else {
        results.push(...qResults);
      }
    });

    res.json(results);
  })
);

export default router;
