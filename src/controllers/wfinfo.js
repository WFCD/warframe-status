'use strict';

const express = require('express');
const flatCache = require('flat-cache');
const path = require('path');
const { CronJob: Job } = require('cron');

const Settings = require('../lib/settings');
const { logger, cache, ah } = require('../lib/utilities');

const router = express.Router();
let infoCache;

router.use((req, res, next) => {
  if (!infoCache) infoCache = flatCache.load('.wfinfo', path.resolve(__dirname, '../../'));
  next();
});

router.get(
  '/filtered_items/?',
  cache('1 hour'),
  ah(async (req, res) => {
    logger.silly(`Got ${req.originalUrl}`);

    if (Settings.wfInfo?.filteredItems) {
      return res.status(200).json(infoCache.getKey('filteredItems'));
    }
    return res.status(503).json({ code: 503, error: 'WFInfo Data Services Unavailable' });
  })
);

router.get(
  '/prices/?',
  cache('1 hour'),
  ah(async (req, res) => {
    logger.silly(`Got ${req.originalUrl}`);

    if (Settings.wfInfo?.prices) {
      return res.status(200).json(infoCache.getKey('prices'));
    }
    return res.status(503).json({ code: 503, error: 'WFInfo Data Services Unavailable' });
  })
);

// eslint-disable-next-line no-new
new Job(
  '0 5 * * * *',
  /* istanbul ignore next */
  () => {
    /* istanbul ignore next */
    infoCache = flatCache.load('.wfinfo', path.resolve(__dirname, '../../'));
  },
  undefined,
  true
);

module.exports = router;
