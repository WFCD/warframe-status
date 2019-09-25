'use strict';

const express = require('express');

const router = express.Router();

const { setHeadersAndJson } = require('../lib/utilities');

const rss = require('../lib/caches/RSSSocketEmitter');

router.get('/', (req, res) => {
  // logger.debug(JSON.stringify(rss.feeder.list().length));

  setHeadersAndJson(res, rss.feeder.list().map(i => ({ url: i.url, items: i.items })));
});

module.exports = router;
