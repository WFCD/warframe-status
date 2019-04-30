'use strict';

const Cache = require('../lib/caches/cache');
const express = require('express');
const {
  logger, setHeadersAndJson, ah, cache, platforms, titleCase,
} = require('../lib/utilities');

const router = express.Router();

const rivenCaches = {};

const groupRivenData = (cacheStrData) => {
  const parsed = JSON.parse(cacheStrData);
  
  const byType = {};
  parsed.forEach(rivenD => {
    if (rivenD.compatibility === null) {
      rivenD.compatibility = `Veiled ${rivenD.itemType}`;
    }

    rivenD.compatibility = titleCase(rivenD.compatibility.replace('<ARCHWING>', '').trim());

    if (!byType[rivenD.itemType]) {
      byType[rivenD.itemType] = {};
    }
    if (!byType[rivenD.itemType][rivenD.compatibility]) {
      byType[rivenD.itemType][rivenD.compatibility] = {
        'rerolled': null,
        'unrolled': null,
      };
    }

    byType[rivenD.itemType][rivenD.compatibility][rivenD.rerolled ? 'rerolled' : 'unrolled'] = rivenD;
  });

  return byType;
}

platforms.forEach(platform => {
  const rCache = new Cache(`http://n9e5v4d8.ssl.hwcdn.net/repos/weeklyRivens${platform.toUpperCase()}.json`, 604800000, {
    parser: groupRivenData,
  });
  rCache.startUpdating();
  rivenCaches[platform] = rCache;
});

router.use((req, res, next) => {
  req.platform = (req.baseUrl.replace('/', '').trim().split('/')[0] || '').toLowerCase();
  if (req.platform === 'ns') {
    req.platform = 'swi';
  }

  if (!platforms.includes(req.platform)) {
    if (req.header('platform')) {
      req.platform = req.header('platform');
    } else {
      req.platform = 'pc';
    }
  }
  next();
});

router.get('/', cache('1 week'), ah(async (req, res) => {
  logger.silly(`Got ${req.originalUrl}`);
  const rC = rivenCaches[req.platform];
  setHeadersAndJson(res, await rC.getData());
}));

router.get('/search/:query', cache('10 hours'), ah(async (req, res) => {
  logger.silly(`Got ${req.originalUrl}`);
  const query = req.params.query
  const results = {};
  const rCache = await rivenCaches[req.platform].getData();
  
  Object.keys(rCache).forEach(type => {
    Object.keys(rCache[type]).forEach(compatibility => {
      if (compatibility.toLowerCase().includes(query.toLowerCase())) {
        results[compatibility] = rCache[type][compatibility];
      }
    });
  });
  setHeadersAndJson(res, results);
}));

module.exports = router;
