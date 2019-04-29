'use strict';

const express = require('express');
const Nexus = require('warframe-nexus-query');
const NexusFetcher = require('nexus-stats-api');

const {
  logger, setHeadersAndJson, ah, cache, platforms
} = require('../lib/utilities');

const router = express.Router();


const nexusOptions = {
  user_key: process.env.NEXUSSTATS_USER_KEY || undefined,
  user_secret: process.env.NEXUSSTATS_USER_SECRET || undefined,
  api_url: process.env.NEXUS_API_OVERRIDE || undefined,
  auth_url: process.env.NEXUS_AUTH_OVERRIDE || undefined,
  ignore_limiter: true,
};

const nexusFetcher = new NexusFetcher(nexusOptions.nexusKey
    && nexusOptions.nexusSecret ? nexusOptions : {});

const nexusQuerier = new Nexus(nexusFetcher);

router.use((req, res, next) => {
  req.platform = req.get('platform');
  next();
});

router.get('/:type/:query', cache('1 hour'), ah(async (req, res) => {
  let value = undefined;
  logger.silly(`Got ${req.originalUrl}`);
  switch (req.params.type) {
    case 'string':
      value = await nexusQuerier.priceCheckQueryString(req.params.query, undefined, req.platform);
      break;
    case 'find':
      value = await nexusQuerier.priceCheckQuery(req.params.query, req.platform);
      break;
    case 'attachment':
      value = await nexusQuerier.priceCheckQueryAttachment(req.params.query, undefined, req.platform);
      break;
    default:
      break;
  }
  if (value) {
    setHeadersAndJson(res, value);
  } else {
    res.status(400).json({
      error: `Unable to pricecheck \`${query}\``,
      code: 400,
    });
  }

}));

module.exports = router;
