'use strict';

const express = require('express');
const helmet = require('helmet');
const winston = require('winston');
const Worldstate = require('warframe-worldstate-parser');
const Cache = require('./lib/cache.js');

const parser = function parser(data) {
  return new Worldstate(data);
};

const platforms = ['pc', 'ps4', 'xb1'];
const items = [
  'news',
  'events',
  'alerts',
  'sortie',
  'syndicateMissions',
  'fissures',
  'globalUpgrades',
  'flashSales',
  'invasions',
  'darkSectors',
  'voidTrader',
  'dailyDeals',
  'simaris',
  'conclaveChallenges',
  'persistentEnemies',
];
const worldStates = {};

platforms.forEach((p) => {
  const url = `http://content${p === 'pc' ? '' : `.${p}`}.warframe.com/dynamic/worldState.php`;
  worldStates[p] = new Cache(url, process.env.CACHE_TIMEOUT || 60000, { parser });
  worldStates[p].startUpdating();
});

const app = express();
app.use(helmet());

app.get('/', (req, res) => {
  res.redirect('/pc');
});

app.get('/:platform', (req, res) => {
  winston.info(`Got ${req.originalUrl}`);
  if (!platforms.includes(req.params.platform)) {
    res.status(404).end();
    return;
  }
  worldStates[req.params.platform].getData().then((data) => {
    res.json(data);
  }).catch(winston.error);
});

app.get('/:platform/:item', (req, res) => {
  winston.info(`Got ${req.originalUrl}`);
  if (!platforms.includes(req.params.platform) || !items.includes(req.params.item)) {
    res.status(404).end();
    return;
  }
  worldStates[req.params.platform].getData().then((data) => {
    res.json(data[req.params.item]);
  }).catch(winston.error);
});

app.use((req, res) => {
  res.status(404).end();
});

app.listen(process.env.PORT || 3000, process.env.HOSTNAME || '127.0.0.1');
