'use strict';

const express = require('express');

const router = express.Router();

const { logger, worldState } = require('../lib/utilities');

router.get('/', (req, res) => {
  logger.silly(`Got ${req.originalUrl}`);

  res.json(worldState.getRss());
});

module.exports = router;
