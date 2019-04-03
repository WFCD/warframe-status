'use strict';

const express = require('express');

const router = express.Router();

const {
  Items, logger, setHeadersAndJson, cache,
} = require('../lib/utilities');

const items = new Items();

router.get('/', cache('10 hours'), (req, res) => {
  logger.log('silly', `Got ${req.originalUrl}`);
  setHeadersAndJson(res, items);
});

router.get('/:item', cache('10 hours'), (req, res) => {
  logger.log('silly', `Got ${req.originalUrl}`);
  let result;
  let exact = false;
  items.forEach((item) => {
    if (item.name.toLowerCase() === req.params.item.toLowerCase()) {
      result = item;
      exact = true;
    }
    if (item.name.toLowerCase().indexOf(req.params.item.toLowerCase()) > -1 && !exact) {
      result = item;
    }
  });
  if (result) {
    setHeadersAndJson(res, result);
  } else {
    res.status(404).send('No such Item.').end();
  }
});

router.get('/search/:query', cache('10 hours'), (req, res) => {
  logger.log('silly', `Got ${req.originalUrl}`);
  const queries = req.params.query.trim().split(',').map(q => q.trim());
  const results = [];
  queries.forEach((query) => {
    items.forEach((item) => {
      if (item.name.toLowerCase().indexOf(query) > -1) {
        results.push(item);
      }
    });
  });
  setHeadersAndJson(res, Array.from(new Set(results)));
});

module.exports = router;
