'use strict';

const express = require('express');
const {
  logger, worldState, platforms, cache, languages,
} = require('../lib/utilities');

const get = (platform, language) => {
  try {
    return worldState.getWorldstate(platform, language);
  } catch (e) {
    logger.debug(e);
    return undefined;
  }
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

  req.language = (req.header('Accept-Language') || 'en').substr(0, 2).toLowerCase();
  req.language = (req.query.language || req.language || 'en').substr(0, 2);
  if (req.language !== 'en') {
    logger.info(`got a request for ${req.language}`);
  }
  if (!(req.language && languages.includes(req.language))) {
    req.language = 'en';
  }
  next();
});

router.get('/', (req, res) => {
  logger.verbose(`Got ${req.originalUrl}`);
  const ws = get(req.platform, req.language);
  res.setHeader('Content-Language', req.language);
  res.json(ws);
});

router.use('/rivens', require('./rivens'));

router.get('/:field', (req, res) => {
  logger.silly(`Got ${req.originalUrl}`);
  const ws = get(req.platform, req.language);

  if (ws && ws[req.params.field]) {
    res.setHeader('Content-Language', req.language);
    res.json(ws[req.params.field]);
  } else if (req.params.field && languages.includes(req.params.field.substr(0, 2).toLowerCase())) {
    const ows = get(req.platform, req.params.field.substr(0, 2).toLowerCase());
    res.json(ows);
  } else {
    res.status(400).json({ error: 'No such worldstate field', code: 400 });
  }
});

router.get('/:language/:field', cache('1 minute'), (req, res) => {
  logger.silly(`Got ${req.originalUrl}`);
  if (languages.includes(req.params.language.substr(0, 2).toLowerCase())) {
    req.language = req.params.language.substr(0, 2).toLowerCase();
  }
  const ws = get(req.platform, req.language);

  if (ws[req.params.field]) {
    res.setHeader('Content-Language', req.language);
    res.json(ws[req.params.field]);
  } else {
    res.status(400).json({ error: 'No such worldstate field', code: 400 });
  }
});

module.exports = router;
