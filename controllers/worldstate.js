'use strict';

const express = require('express');

const twitter = require('../lib/caches/TwitterCache');

const {
  logger, setHeadersAndJson, worldStates, ah, platforms, cache,
} = require('../lib/utilities');

const router = express.Router();

router.use((req, res, next) => {
  req.platform = (req.baseUrl.replace('/', '').trim().split('/')[0] || '').toLowerCase();
  if (req.platform === 'ns') {
    req.platform = 'swi';
  }

  if (!platforms.includes(req.platform)) {
    req.platform = 'pc';
  }

  req.language = (req.header('Accept-Language') || 'en').substr(0, 2);
  if (req.language !== 'en') {
    logger.info(`got a request for ${req.language}`);
  }
  next();
});

router.get('/', cache('1 minute'), ah(async (req, res) => {
  logger.silly(`Got ${req.originalUrl}`);
  const ws = await worldStates[req.platform][req.language].getData();
  ws.twitter = await twitter.getData();
  setHeadersAndJson(res, ws);
}));

router.use('/rivens', require('./rivens'));

router.get('/:field', cache('1 minute'), ah(async (req, res) => {
  logger.silly(`Got ${req.originalUrl}`);
  const ws = await worldStates[req.platform][req.language].getData();
  ws.twitter = await twitter.getData(); // inject twitter data

  if (ws[req.params.field]) {
    setHeadersAndJson(res, ws[req.params.field]);
  } else {
    res.status(400).json({ error: 'No such worldstate field', code: 400 });
  }
}));

module.exports = router;
