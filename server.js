'use strict';

const express = require('express');
const Worldstate = require('warframe-worldstate-parser');
const Cache = require('./lib/cache.js');

const worldStates = {
  pc: {
    url: 'http://content.warframe.com/dynamic/worldState.php',
  },
  ps4: {
    url: 'http://content.ps4.warframe.com/dynamic/worldState.php',
  },
  xb1: {
    url: 'http://content.xb1.warframe.com/dynamic/worldState.php',
  },
};

const has = Object.prototype.hasOwnProperty;

Object.keys(worldStates).forEach((k) => {
  worldStates[k].cache = new Cache(worldStates[k].url, process.env.CACHE_TIMEOUT || 60000,
    { Parser: Worldstate });
  worldStates[k].cache.startUpdating();
});

const app = express();

app.get('/', (req, res) => {
  res.redirect('/pc');
});

app.get('/:platform', (req, res) => {
  if (!has.call(worldStates, req.params.platform)) {
    res.status(404).end();
    return;
  }
  worldStates[req.params.platform].cache.getData().then((data) => {
    res.json(data);
  });
});

app.listen(process.env.PORT || 3000);
