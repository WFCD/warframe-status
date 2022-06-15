'use strict';

const express = require('express');
const fetch = require('node-fetch');
const ArsenalParser = require('@wfcd/arsenal-parser');
const flatCache = require('flat-cache');
const path = require('path');

const {
  logger, noResult, cache,
} = require('../lib/utilities');

const router = express.Router();

const WF_ARSENAL_ID = 'ud1zj704c0eb1s553jbkayvqxjft97';
let token;

router.use((req, res, next) => {
  const tokenCache = flatCache.load('.twitch', path.resolve(__dirname, '../../'));
  token = tokenCache.getKey('token');
  next();
});

router.get('/:username', cache('1 hour'), async (req, res) => {
  logger.silly(`Got ${req.originalUrl}`);
  if (!token || token === 'unset') return res.status(503).json({ code: 503, error: 'Service Unavailable' });
  const profileUrl = `https://content.${req.platform === 'pc' ? '' : `${req.platform}.`}warframe.com/dynamic/twitch/getActiveLoadout.php?account=${encodeURIComponent(req.params.username.toLowerCase())}`;
  const data = await fetch(profileUrl, {
    headers: {
      'User-Agent': process.env.USER_AGENT || 'Node.js Fetch',
      Origin: `https://${WF_ARSENAL_ID}.ext-twitch.tv`,
      Referer: `https://${WF_ARSENAL_ID}.ext-twitch.tv`,
      Authorization: `Bearer ${token}`,
    },
  })
    .then((d) => d.json());
  if (!data.accountInfo) {
    return noResult(res);
  }
  return res.status(200).json(new ArsenalParser(data));
});

module.exports = router;
