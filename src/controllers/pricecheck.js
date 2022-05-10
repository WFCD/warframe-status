'use strict';

const express = require('express');
const Nexus = require('warframe-nexus-query');

const {
  logger, ah, cache, noResult,
} = require('../lib/utilities');
const Settings = require('../lib/settings');

const unavailable = {
  error: 'Service temporarily unavailable',
  code: 503,
};
const router = express.Router();
const nexusQuerier = new Nexus({ logger, skipNexus: true });

router.use((req, res, next) => {
  req.platform = req.get('platform');
  next();
});

router.get('/:type/:query', cache('1 hour'), ah(async (req, res) => {
  if (!Settings.priceChecks) {
    return res.status(503).json(unavailable);
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
    }
    /* istanbul ignore else */
    if (value) {
      return res.status(200).json(value);
    }
    /* istanbul ignore next */
    return noResult(res);
  } catch (error) /* istanbul ignore next */ {
    logger.error(error);
    return res.status(500).json({
      error: `An error ocurred pricechecking \`${req.params.query}\``,
      code: 500,
    });
  }
}));

module.exports = router;
