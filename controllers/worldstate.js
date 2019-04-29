'use strict';

const express = require('express');
const {
  logger, setHeadersAndJson, worldStates, ah, cache, platforms, twitter,
} = require('../lib/utilities');

const router = express.Router();

router.use((req, res, next) => {
  req.platform = (req.baseUrl.replace('/', '').trim().split('/')[0] || '').toLowerCase();
  if (req.platform === 'ns') {
    req.platform = 'swi';
  }

  if (!platforms.includes(req.platform)) {
    req.platform = undefined;
  }
  next();
});

router.get('/', cache('1 minute'), ah(async (req, res) => {
  logger.silly(`Got ${req.originalUrl}`);
  const ws = await worldStates[req.platform].getData();
  ws.twitter = await twitter.getData();
  setHeadersAndJson(res, ws);
}));

router.use('/rivens', require('./rivens'));

router.get('/:field', cache('1 minute'), ah(async (req, res) => {
  logger.silly(`Got ${req.originalUrl}`);
  const ws = await worldStates[req.platform].getData();
  ws.twitter = await twitter.getData(); // inject twitter data

  if (ws[req.params.field]) {
    setHeadersAndJson(res, ws[req.params.field]);
  } else {
    res.status(400).json({ error: 'No such worldstate field', code: 400 });
  }
}));

module.exports = router;
