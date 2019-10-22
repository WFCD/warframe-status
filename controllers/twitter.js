'use strict';

const express = require('express');

const router = express.Router();
const twitter = require('../lib/caches/TwitterCache');

const {
  logger, setHeadersAndJson, cache, ah,
} = require('../lib/utilities');

if (twitter.clientInfoValid) {
  router.get('/', cache('1 minute'), ah(async (req, res) => {
    logger.silly(`Got ${req.originalUrl}`);
    setHeadersAndJson(res, await twitter.getData());
  }));
}

module.exports = router;
