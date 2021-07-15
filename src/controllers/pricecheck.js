'use strict';

const express = require('express');
const Nexus = require('warframe-nexus-query');

const {
  logger, ah, cache, noResult,
} = require('../lib/utilities');

const router = express.Router();
const nexusQuerier = new Nexus({ logger, skipNexus: true });

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
      res.json(value);
    } else {
      noResult(res);
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
