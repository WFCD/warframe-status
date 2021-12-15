'use strict';

const express = require('express');

const router = express.Router();

const {
  logger, cache, ah, worldState,
} = require('../lib/utilities');

router.get('/', cache('1 minute'), ah(async (req, res) => {
  logger.silly(`Got ${req.originalUrl}`);
  const twitific = process.env.TWITTER_TIMEOUT
    && process.env.TWITTER_SECRET
    && process.env.TWITTER_BEARER_TOKEN;

  if (twitific) {
    const twd = await worldState.getTwitter();
    if (twd) {
      return res.status(200).json(twd);
    }
  }
  return res.status(404).json({ code: 404, error: 'No Twitter Data' });
}));

module.exports = router;
