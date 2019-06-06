'use strict';

const express = require('express');
const Nexus = require('warframe-nexus-query');
const NexusFetcher = require('nexushub-client');

const {
  logger, setHeadersAndJson, ah, cache,
} = require('../lib/utilities');

const router = express.Router();


const nexusOptions = {
  user_key: process.env.NEXUSHUB_USER_KEY || undefined,
  user_secret: process.env.NEXUSHUB_USER_SECRET || undefined,
  api_url: process.env.NEXUS_API_OVERRIDE || undefined,
  auth_url: process.env.NEXUS_AUTH_OVERRIDE || undefined,
  ignore_limiter: true,
};

const nexus = new NexusFetcher(nexusOptions.nexusKey
    && nexusOptions.nexusSecret ? nexusOptions : {});

nexus.connecting()
  .then(() => nexus.connection.client.on('unexpected-response', () => {}));


const nexusQuerier = new Nexus({ logger, nexusApi: nexus });

router.use((req, res, next) => {
  req.platform = req.get('platform');
  next();
});

router.get('/:type/:query', cache('1 hour'), ah(async (req, res) => {
  if (process.env.DISABLE_PRICECHECKS) {
    res.status(503).json({
      error: 'Service temporarily unavailable',
      code: 503,
    });

    return;
  }

  let value;
  logger.silly(`Got ${req.originalUrl}`);
  try {
    switch (req.params.type) {
      case 'string':
        value = await nexusQuerier.priceCheckQueryString(req.params.query, undefined, req.platform);
        break;
      case 'find':
        value = await nexusQuerier.priceCheckQuery(req.params.query, req.platform);
        break;
      case 'attachment':
        value = await nexusQuerier
          .priceCheckQueryAttachment(req.params.query, undefined, req.platform);
        break;
      default:
        break;
    }
    if (value) {
      setHeadersAndJson(res, value);
    } else {
      res.status(400).json({
        error: `Unable to pricecheck \`${req.params.query}\``,
        code: 400,
      });
    }
  } catch (error) {
    logger.error(error);
    res.status(500).json({
      error: `An error ocurred pricechecking \`${req.params.query}\``,
      code: 500,
    });
  }
}));

module.exports = router;
