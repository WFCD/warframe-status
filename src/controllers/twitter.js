'use strict';

const express = require('express');

const router = express.Router();

const {
  logger, cache, ah, worldState,
} = require('../lib/utilities');

router.get('/', cache('1 minute'), ah(async (req, res) => {
  logger.silly(`Got ${req.originalUrl}`);

  const twd = await worldState.getTwitter();
  if (twd) {
    res.json(twd);
  } else {
    res.status(404).json({ code: 404, message: 'No Twitter Data' });
  }
}));

module.exports = router;
