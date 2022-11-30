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

const redirectCheck = (req, res) => {
  if (req.platform !== 'pc') {
    const redirPath = req.originalUrl.replace(/\/(ps4|psn|swi|xb1|ns)\/?/gi, '/pc/');
    return res.redirect(301, redirPath);
  }
  return false;
};

const router = express.Router({ strict: true });

router.use((req, res, next) => {
  if (res.writableEnded) return;
  try {
    const redirected = redirectCheck(req, res);
    /* istanbul ignore if */
    if (redirected) return;
    next();
  } catch (e) {
    // swallow for now
  }
});

router.get('/', (req, res) => {
  if (res.writableEnded) return;
  const ws = get(req.platform, req.language);
  res.setHeader('Content-Language', req.language);
  res.json(ws);
});

router.use('/rivens/?', require('./rivens'));

router.get('/:field/?', (req, res) => {
  const ws = get(req.platform, req.language);
  if (ws?.[req.params.field]) {
    res.setHeader('Content-Language', req.language);
    res.json(ws[req.params.field]);
  } else if (req.params.field && languages.includes(req.params.field.substring(0, 2).toLowerCase())) {
    const ows = get(req.platform, req.params.field.substring(0, 2).toLowerCase());
    res.json(ows);
  } else if (!res.writableEnded) {
    res.status(404).json({ error: 'No such worldstate field', code: 404 });
  }
});

router.get('/:language/:field/?', cache('1 minute'), (req, res) => {
  if (languages.includes(req.params.language.substring(0, 2).toLowerCase())) {
    req.language = req.params.language.substring(0, 2).toLowerCase();
  }
  const ws = get(req.platform, req.language);

  if (ws?.[req.params.field]) {
    res.setHeader('Content-Language', req.language);
    res.json(ws[req.params.field]);
  } else {
    res.status(404).json({ error: 'No such worldstate field', code: 404 });
  }
});

module.exports = router;
