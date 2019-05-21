'use strict';

const express = require('express');
const Worldstate = require('warframe-worldstate-parser');

const Cache = require('../lib/caches/cache.js');

const {
  logger, setHeadersAndJson, worldStates, ah, platforms, twitter,
} = require('../lib/utilities');

const router = express.Router();


const parser = function parser(data) {
  return new Worldstate(data);
};

platforms.forEach((p) => {
  const url = `http://content${p === 'pc' ? '' : `.${p}`}.warframe.com/dynamic/worldState.php`;
  worldStates[p] = new Cache(url, process.env.CACHE_TIMEOUT || 60000, { parser });
  worldStates[p].startUpdating();
});

router.use((req, res, next) => {
  req.platform = (req.baseUrl.replace('/', '').trim().split('/')[0] || '').toLowerCase();
  if (req.platform === 'ns') {
    req.platform = 'swi';
  }

  if (!platforms.includes(req.platform)) {
    req.platform = undefined;
  }
  next();
});

router.get('/', /* cache('1 minute'), */ ah(async (req, res) => {
  logger.silly(`Got ${req.originalUrl}`);
  const ws = await worldStates[req.platform].getData();
  ws.twitter = await twitter.getData();
  setHeadersAndJson(res, ws);
}));

router.use('/rivens', require('./rivens'));

router.get('/:field', /* cache('1 minute'), */ ah(async (req, res) => {
  logger.silly(`Got ${req.originalUrl}`);
  const ws = await worldStates[req.platform].getData();
  ws.twitter = await twitter.getData(); // inject twitter data

  if (ws[req.params.field]) {
    setHeadersAndJson(res, ws[req.params.field]);
  } else {
    res.status(400).json({ error: 'No such worldstate field', code: 400 });
  }
}));

module.exports = router;
