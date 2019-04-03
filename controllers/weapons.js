'use strict';

const express = require('express');

const router = express.Router();

const {
  Items, logger, setHeadersAndJson, cache,
} = require('../lib/utilities');

const weapons = new Items({ category: ['Primary', 'Secondary', 'Melee'] });

router.get('/', cache('10 hours'), (req, res) => {
  logger.log('silly', `Got ${req.originalUrl}`);
  setHeadersAndJson(res, weapons);
});

router.get('/:item', cache('10 hours'), (req, res) => {
  logger.log('silly', `Got ${req.originalUrl}`);
  let result;
  let exact = false;
  weapons.forEach((weapon) => {
    if (weapon.name.toLowerCase() === req.params.item.toLowerCase()) {
      result = weapon;
      exact = true;
    }
    if (weapon.name.toLowerCase().indexOf(req.params.item.toLowerCase()) > -1 && !exact) {
      result = weapon;
    }
  });
  if (result) {
    setHeadersAndJson(res, result);
  } else {
    res.status(404).send('No such Weapon.').end();
  }
});

router.get('/search/:query', cache('10 hours'), (req, res) => {
  logger.log('silly', `Got ${req.originalUrl}`);
  const queries = req.params.query.trim().split(',').map(q => q.trim());
  const results = [];
  queries.forEach((query) => {
    weapons.forEach((weapon) => {
      if (weapon.name.toLowerCase().indexOf(query) > -1) {
        results.push(weapon);
      }
    });
  });
  setHeadersAndJson(res, Array.from(new Set(results)));
});

module.exports = router;
