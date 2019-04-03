'use strict';

const express = require('express');

const router = express.Router();

const {
  Items, logger, setHeadersAndJson, cache,
} = require('../lib/utilities');

const warframes = new Items({ category: ['Warframes'] });

router.get('/', cache('10 hours'), (req, res) => {
  logger.log('silly', `Got ${req.originalUrl}`);
  setHeadersAndJson(res, warframes);
});

router.get('/:item', cache('10 hours'), (req, res) => {
  logger.log('silly', `Got ${req.originalUrl} • ${req.params.item}`);
  if (req.params.item) {
    let result;
    let exact = false;
    warframes.forEach((warframe) => {
      if (warframe.name.toLowerCase() === req.params.item.toLowerCase()) {
        result = warframe;
        exact = true;
      }
      if (warframe.name.toLowerCase().indexOf(req.params.item.toLowerCase()) > -1 && !exact) {
        result = warframe;
      }
    });
    if (result) {
      setHeadersAndJson(res, result);
    } else {
      res.status(404).send('No such Warframe.').end();
    }
  } else {
    setHeadersAndJson(res, warframes);
  }
});

router.get('/search/:query', cache('10 hours'), (req, res) => {
  logger.log('silly', `Got ${req.originalUrl}`);
  const queries = req.params.query.trim().split(',').map(q => q.trim());
  const results = [];
  queries.forEach((query) => {
    warframes.forEach((warframe) => {
      if (warframe.name.toLowerCase().indexOf(query) > -1) {
        results.push(warframe);
      }
    });
  });
  setHeadersAndJson(res, Array.from(new Set(results)));
});

module.exports = router;
