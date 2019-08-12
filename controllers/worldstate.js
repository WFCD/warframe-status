'use strict';

const express = require('express');

const twitter = require('../lib/caches/TwitterCache');

const {
  logger, setHeadersAndJson, worldStates, ah, platforms, cache, languages,
} = require('../lib/utilities');

const get = async (platform, language) => {
  const ws = await worldStates[platform][language].getData();
  ws.twitter = await twitter.getData(); // inject twitter data
};

const router = express.Router();

router.use((req, res, next) => {
  req.platform = (req.baseUrl.replace('/', '').trim().split('/')[0] || '').toLowerCase();
  if (req.platform === 'ns') {
    req.platform = 'swi';
  }

  if (!platforms.includes(req.platform)) {
    req.platform = 'pc';
  }

  // req.language = (req.header('Accept-Language') || 'en').substr(0, 2);
  req.language = (req.query.language || 'en').substr(0, 2);
  if (req.language !== 'en') {
    logger.info(`got a request for ${req.language}`);
  }
  if (!(req.language && languages.includes(req.language))) {
    req.language = 'en';
  }
  next();
});

router.get('/', cache('1 minute'), ah(async (req, res) => {
  logger.silly(`Got ${req.originalUrl}`);
  const ws = await worldStates[req.platform][req.language].getData();
  ws.twitter = await twitter.getData();
  res.setHeader('Content-Language', req.language);
  setHeadersAndJson(res, ws);
}));

router.use('/rivens', require('./rivens'));

router.get('/:field', cache('1 minute'), ah(async (req, res) => {
  logger.silly(`Got ${req.originalUrl}`);
  const ws = await get(req.platform, req.language);

  if (ws[req.params.field]) {
    res.setHeader('Content-Language', req.language);
    setHeadersAndJson(res, ws[req.params.field]);
  } else if (languages.includes(req.field.substr(0, 2))) {
    const ows = await get(req.platform, req.field.substr(0, 2));
    setHeadersAndJson(res, ows);
  } else {
    res.status(400).json({ error: 'No such worldstate field', code: 400 });
  }
}));

router.get('/:language/:field', cache('1 minute'), ah(async (req, res) => {
  logger.silly(`Got ${req.originalUrl}`);
  const ws = await get(req.platform, req.language);

  if (ws[req.params.field]) {
    res.setHeader('Content-Language', req.language);
    setHeadersAndJson(res, ws[req.params.field]);
  } else {
    res.status(400).json({ error: 'No such worldstate field', code: 400 });
  }
}));

module.exports = router;
