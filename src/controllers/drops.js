'use strict';

const express = require('express');

const { logger, cache, ah } = require('../lib/utilities');

const dropCache = require('../lib/caches/Drops');

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

router.get('/', cache('24 hours'), ah(async (req, res) => {
  logger.silly(`Got ${req.originalUrl}`);
  res.json(await dropCache.getData());
}));

router.get('/search/:query', cache('1 hour'), ah(async (req, res) => {
  logger.silly(`Got ${req.originalUrl}`);
  const drops = await dropCache.getData();
  const queries = req.params.query.split(',').map((q) => q.trim());
  let results = [];
  queries.forEach((query) => {
    let qResults = drops
      .filter((drop) => drop.place.toLowerCase().includes(query.toLowerCase())
      || drop.item.toLowerCase().includes(query.toLowerCase()));

    qResults = qResults.length > 0 ? qResults : [];

    if (req.query.grouped_by && req.query.grouped_by === 'location') {
      if (typeof results !== 'object') {
        results = {};
      }

      results = {
        ...groupLocation(qResults),
        ...results,
      };
    } else {
      results.push(...qResults);
    }
  });

  res.json(results);
}));

module.exports = router;
