'use strict';

const express = require('express');

const {
  logger, dropCache, setHeadersAndJson, cache, ah,
} = require('../lib/utilities');

const router = express.Router();

const groupLocation = (data) => {
  const locBase = {};
  data.forEach((reward) => {
    if (!locBase[reward.place]) {
      locBase[reward.place] = {
        rewards: [],
      };
    }
    const slimmed = Object.assign({}, reward);
    delete slimmed.place;
    locBase[reward.place].rewards.push(slimmed);
  });
  return locBase;
};

router.get('/', cache('24 hours'), ah(async (req, res) => {
  logger.log('silly', `Got ${req.originalUrl}`);
  setHeadersAndJson(res, await dropCache.getData());
}));

router.get('/search/:query', cache('10 hours'), ah(async (req, res) => {
  logger.log('silly', `Got ${req.originalUrl}`);
  const drops = await dropCache.getData();
  const queries = req.params.query.split(',').map(q => q.trim());

  const dropResults = queries.map((query) => {
    let results = drops
      .filter(drop => drop.place.toLowerCase().includes(query.toLowerCase())
      || drop.item.toLowerCase().includes(query.toLowerCase()));

    results = results.length > 0 ? results : [];

    if (req.query.grouped_by && req.query.grouped_by === 'location') {
      results = groupLocation(results);
    }
    return results;
  });
  setHeadersAndJson(res, dropResults);
}));

module.exports = router;
