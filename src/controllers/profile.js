'use strict';

const express = require('express');
const fetch = require('node-fetch');
const ArsenalParser = require('@wfcd/arsenal-parser');

const router = express.Router();

const {
  logger, noResult, platforms, languages, cache,
} = require('../lib/utilities');

router.use((req, res, next) => {
  req.platform = (req.baseUrl.replace('/', '').trim().split('/')[0] || '').toLowerCase();
  if (req.platform === 'ns') req.platform = 'swi';
  if (!platforms.includes(req.platform) || !req.platform) req.platform = 'pc';

  req.language = (req.header('Accept-Language') || 'en').substr(0, 2).toLowerCase();
  req.language = (req.query.language || req.language).substr(0, 2);
  if (req.language !== 'en') logger.info(`got a request for ${req.language}`);
  if (!(req.language && languages.includes(req.language))) req.language = 'en';
  next();
});

router.get('/:username', cache('10 minutes'), async (req, res) => {
  logger.silly(`Got ${req.originalUrl}`);
  const profileUrl = `https://content.${req.platform === 'pc' ? '' : `${req.platform}.`}warframe.com/dynamic/twitch/getActiveLoadout.php?account=${encodeURIComponent(req.params.username.toLowerCase())}`;
  const data = await fetch(profileUrl, { headers: { 'User-Agent': process.env.USER_AGENT || 'Node.js Fetch' } })
    .then((d) => d.json());
  if (!data.accountInfo) {
    return noResult(res);
  }
  return res.status(200).json(new ArsenalParser(data));
});

module.exports = router;
