'use strict';

const Route = require('../Route.js');
const Nexus = require('warframe-nexus-query');
const NexusFetcher = require('nexus-stats-api');

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

class PriceCheck extends Route {
  async handle(req, res) {
    let value = '';
    this.logger.log('silly', `Got ${req.originalUrl}`);
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
    this.setHeadersAndJson(res, value);
  }
}

module.exports = PriceCheck;
