'use strict';

const express = require('express');
const flatCache = require('flat-cache');
const path = require('path');

const Settings = require('../lib/settings');
const {
  logger, cache, ah,
} = require('../lib/utilities');

const router = express.Router();
const infoCache = flatCache.load('.wfinfo', path.resolve(__dirname, '../../'));

router.get('/filtered_items', cache('1 hour'), ah(async (req, res) => {
  logger.silly(`Got ${req.originalUrl}`);

  if (Settings.wfInfo?.filteredItems) {
    return res.status(200).json(infoCache.getKey('filteredItems'));
  }
  return res.status(503).json({ code: 503, error: 'WFInfo Data Services Unavailable' });
}));

router.get('/prices', cache('1 hour'), ah(async (req, res) => {
  logger.silly(`Got ${req.originalUrl}`);

  if (Settings.wfInfo?.prices) {
    return res.status(200).json(infoCache.getKey('prices'));
  }
  return res.status(503).json({ code: 503, error: 'WFInfo Data Services Unavailable' });
}));

module.exports = router;
