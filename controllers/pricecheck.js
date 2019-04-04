'use strict';

const express = require('express');
const Nexus = require('warframe-nexus-query');
const NexusFetcher = require('nexus-stats-api');

const { logger, setHeadersAndJson, ah } = require('../lib/utilities');

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

router.get('/:type/:query',  ah(async (req, res) => {
  let value = '';
  logger.log('silly', `Got ${req.originalUrl}`);
  switch (req.params.type) {
    case 'string':
      value = await nexusQuerier.priceCheckQueryString(req.params.query);
      break;
    case 'find':
      value = await nexusQuerier.priceCheckQuery(req.params.query);
      break;
    case 'attachment':
      value = await nexusQuerier.priceCheckQueryAttachment(req.params.query);
      break;
    default:
      break;
  }
  setHeadersAndJson(res, value);
}));

module.exports = router;
