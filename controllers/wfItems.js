'use strict';

const express = require('express');

const router = express.Router();

const {
  Items, logger, setHeadersAndJson, cache,
} = require('../lib/utilities');

const wfItemData = {
  weapons: {
    items: new Items({ category: ['Primary', 'Secondary', 'Melee'] }),
    name: 'Weapon'
  },
  warframes: {
    items: new Items({ category: ['Warframes'] }),
    name: 'Warframe',
  },
  items: {
    items: new Items(),
    name: 'Item',
  },
  mods: {
    items: new Items({ category: ['Mods'] }),
    name: 'Mod',
  },
};

router.use((req, res, next) => {
  req.items = (req.baseUrl.replace('/', '').trim().split('/')[0] || '').toLowerCase();

  if (Object.keys(wfItemData).includes(req.items)) {
    req.items = wfItemData[req.items];
  }
  next();
});


router.get('/', cache('10 hours'), (req, res) => {
  logger.silly(`Got ${req.originalUrl}`);
  setHeadersAndJson(res, req.items.items);
});

router.get('/:item', cache('10 hours'), (req, res) => {
  logger.silly(`Got ${req.originalUrl}`);
  let result;
  let exact = false;
  req.items.items.forEach((item) => {
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
    res.status(400).json({ error: `No such \`${req.items.name}\`.`, code: 400 });
  }
});

router.get('/search/:query', cache('10 hours'), (req, res) => {
  logger.silly(`Got ${req.originalUrl}`);
  const queries = req.params.query.trim().split(',').map(q => q.trim());
  const results = [];
  queries.forEach((query) => {
    req.items.items.forEach((item) => {
      if (item.name.toLowerCase().indexOf(query) > -1) {
        results.push(item);
      }
    });
  });
  setHeadersAndJson(res, Array.from(new Set(results)));
});

module.exports = router;
