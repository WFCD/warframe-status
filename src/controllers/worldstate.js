import express from 'express';

import { logger, worldState, cache, languages } from '../lib/utilities.js';

import rivens from './rivens.js';

const get = (platform, language) => {
  try {
    return worldState.getWorldstate(language);
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

const filterArray = (req, data) => {
  let filtered = data;
  if (req.query.filter) {
    req.query.filter.split(',').forEach((filter) => {
      const [key, value] = filter.split(':');
      filtered = filtered.filter((item) => String(item[key]) === value);
    });
  }
  return filtered;
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

router.use(['/rivens/', '/rivens'], rivens);

router.get(['/:field/', '/:field'], (req, res) => {
  const ws = get(req.platform, req.language);
  // filter out any fields that can't be language codes (>5 characters)
  if (!Object.keys(ws).includes(req.params.field) && req.params.field.length > 4) {
    res.status(404).json({ error: 'No such worldstate field', code: 404 });
    return;
  }
  if (ws?.[req.params.field]) {
    res.setHeader('Content-Language', req.language);
    if (Array.isArray(ws[req.params.field])) {
      res.json(filterArray(req, ws[req.params.field]));
      return;
    }
    res.json(ws[req.params.field]);
  } else if (req.params.field && languages.includes(req.params.field.substring(0, 2).toLowerCase())) {
    const ows = get(req.platform, req.params.field.substring(0, 2).toLowerCase());
    if (Array.isArray(ows)) {
      res.json(filterArray(req, ows));
      return;
    }
    res.json(ows);
  } else if (!res.writableEnded) {
    res.status(404).json({ error: 'No such worldstate field', code: 404 });
  }
});

router.get(['/:language/:field/', '/:language/:field'], cache('1 minute'), (req, res) => {
  if (languages.includes(req.params.language.substring(0, 2).toLowerCase())) {
    req.language = req.params.language.substring(0, 2).toLowerCase();
  }
  const ws = get(req.platform, req.language);
  if (!Object.keys(ws).includes(req.params.field)) {
    res.status(404).json({ error: 'No such worldstate field', code: 404 });
    return;
  }
  const fieldData = ws?.[req.params.field];

  if (fieldData) {
    res.setHeader('Content-Language', req.language);
    if (Array.isArray(fieldData)) {
      res.json(filterArray(req, fieldData));
      return;
    }
    res.json(fieldData);
  } else if (!res.writableEnded) {
    res.status(404).json({ error: 'No such worldstate field', code: 404 });
  }
});

export default router;
