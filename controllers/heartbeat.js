'use strict';

const express = require('express');

const { logger } = require('../lib/utilities');

const router = express.Router();

router.get('/', (req, res) => {
  logger.silly(`Got ${req.originalUrl}`);
  res.status(200).json({ msg: 'Success', code: 200 });
});

module.exports = router;
