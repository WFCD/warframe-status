'use strict';

const express = require('express');
const ah = require('express-async-handler');
const warframeData = require('warframe-worldstate-data');
const Items = require('warframe-items');

const { transports, createLogger, format } = require('winston');
const apiCache = require('apicache');

const TwitterCache = require('./caches/TwitterCache.js');
const DropCache = require('./caches/DropCache.js');

const platforms = ['pc', 'ps4', 'xb1', 'swi'];
const platformAliases = ['ns'];
const worldStates = {};


const {
  combine, label, printf, colorize,
} = format;


/* Logger setup */
const transport = new transports.Console({ colorize: true });
const logFormat = printf(info => `[${info.label}] ${info.level}: ${info.message}`);
const logger = createLogger({
  format: combine(
    colorize(),
    label({ label: 'API' }),
    logFormat,
  ),
  transports: [transport],
});
logger.level = process.env.LOG_LEVEL || 'info';

/* Warframe Data & Keys */
delete warframeData.weapons;
delete warframeData.warframes;

const wfKeys = Object.keys(warframeData).map(key => key.toLowerCase());
wfKeys.push('drops', 'mods', 'pc', 'ps4', 'xb1', 'swi', 'ns', 'heartbeat', 'warframe');

const titleCase = str => str.toLowerCase().replace(/\b\w/g, l => l.toUpperCase());

module.exports = {
  setHeadersAndJson: (res, json) => {
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'DNT,X-CustomHeader,Keep-Alive,User-Agent,X-Requested-With,If-Modified-Since,Cache-Control,Content-Type,Content-Range,Range');
    res.setHeader('Access-Control-Expose-Headers', 'DNT,X-CustomHeader,Keep-Alive,User-Agent,X-Requested-With,If-Modified-Since,Cache-Control,Content-Type,Content-Range,Range');
    res.json(json);
  },
  logger,
  platforms,
  platformAliases,
  cache: apiCache.options({
    appendKey: req => req.platform || '',
  }).middleware,
  router: express.Router(),
  Items,
  warframeData,
  wfKeys,
  dropCache: new DropCache(logger),
  twitter: new TwitterCache(logger),
  solKeys: Object.keys(warframeData.solNodes),
  worldStates,
  ah,
  titleCase,
};
