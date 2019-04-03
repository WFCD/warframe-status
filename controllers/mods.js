'use strict';

const express = require('express');

const router = express.Router();

const {
  Items, logger, cache, setHeadersAndJson,
} = require('../lib/utilities');

const mods = new Items({ category: ['Mods'] });

router.get('/', cache('24 hours'), (req, res) => {
  logger.log('silly', `Got ${req.originalUrl}`);
  setHeadersAndJson(res, mods);
});

router.get('/:item', cache('1 minute'), (req, res) => {
  let result;
  let exact = false;
  mods.forEach((mod) => {
    if (mod.name.toLowerCase() === req.params.item.toLowerCase()) {
      result = mod;
      exact = true;
    }
    if (mod.name.toLowerCase().indexOf(req.params.item.toLowerCase()) > -1 && !exact) {
      result = mod;
    }
  });
  if (result) {
    setHeadersAndJson(res, result);
  } else {
    res.status(404).send('No such Mod.').end();
  }
});

router.get('/search/:query', cache('10 hours'), (req, res) => {
  const queries = req.params.query.trim().split(',').map(q => q.trim());
  const results = [];
  queries.forEach((query) => {
    mods.forEach((mod) => {
      if (mod.name.toLowerCase().indexOf(query) > -1) {
        results.push(mod);
      }
    });
  });
  setHeadersAndJson(res, Array.from(new Set(results)));
});

module.exports = router;
