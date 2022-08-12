'use strict';

const express = require('express');
const { logger, worldState, cache, languages } = require('../lib/utilities');

const get = (platform, language) => {
  try {
    return worldState.getWorldstate(platform, language);
  } catch (e) /* istanbul ignore next */ {
    logger.debug(e);
    return undefined;
  }
};

const router = express.Router();

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
    res.status(404).json({ error: 'No such worldstate field', code: 404 });
  }
});

router.get('/:language/:field', cache('1 minute'), (req, res) => {
  logger.silly(`Got ${req.originalUrl}`);
  if (languages.includes(req.params.language.substr(0, 2).toLowerCase())) {
    req.language = req.params.language.substr(0, 2).toLowerCase();
  }
  const ws = get(req.platform, req.language);

  if (ws && ws[req.params.field]) {
    res.setHeader('Content-Language', req.language);
    res.json(ws[req.params.field]);
  } else {
    res.status(404).json({ error: 'No such worldstate field', code: 404 });
  }
});

module.exports = router;
