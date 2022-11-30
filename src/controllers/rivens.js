'use strict';

const express = require('express');
const Cache = require('json-fetch-cache');
const { logger, ah, platforms, titleCase, trimPlatform } = require('../lib/utilities');

const router = express.Router({ strict: true });

const rivenCaches = {};

const groupRivenData = (cacheStrData) => {
  /* istanbul ignore if */ if (!cacheStrData.length) return {};
  const stripped = cacheStrData.replace(/NaN/g, 0).replace(/WARNING:.*\n/, '');
  const parsed = JSON.parse(stripped);

  const byType = {};
  parsed.forEach((rivenD) => {
    if (!rivenD.compatibility) {
      rivenD.compatibility = `Veiled ${rivenD.itemType}`;
    }

    rivenD.compatibility = titleCase(rivenD.compatibility.replace('<ARCHWING>', '').trim());

    if (!byType[rivenD.itemType]) {
      byType[rivenD.itemType] = {};
    }
    if (!byType[rivenD.itemType][rivenD.compatibility]) {
      byType[rivenD.itemType][rivenD.compatibility] = {
        rerolled: undefined,
        unrolled: undefined,
      };
    }

    byType[rivenD.itemType][rivenD.compatibility][rivenD.rerolled ? 'rerolled' : 'unrolled'] = rivenD;
  });

  return byType;
};

platforms.forEach((platform) => {
  const rCache = new Cache(
    `https://n9e5v4d8.ssl.hwcdn.net/repos/weeklyRivens${platform.toUpperCase()}.json`,
    604800000,
    {
      parser: groupRivenData,
      logger,
      delayStart: true,
    }
  );
  rCache.startUpdating();
  rivenCaches[platform] = rCache;
});

router.use((req, res, next) => {
  req.platform = trimPlatform(req.baseUrl);
  if (req.platform === 'ns') req.platform = 'swi';
  /* istanbul ignore if */
  if (!platforms.includes(req.platform)) req.platform = req.header('platform') || 'pc';
  next();
});

router.get(
  '/',
  /* cache('1 week'), */ ah(async (req, res) => {
    if (res.writableEnded) return;
    const rC = rivenCaches[req.platform];
    res.json(await rC.getData());
  })
);

router.get(
  '/search/:query/?',
  /* cache('10 hours'), */ ah(async (req, res) => {
    if (res.writableEnded) return;
    const { query } = req.params;
    const results = {};
    const rCache = await rivenCaches[req.platform].getData();

    Object.keys(rCache).forEach((type) => {
      Object.keys(rCache[type]).forEach((compatibility) => {
        if (compatibility.toLowerCase().includes(query.toLowerCase())) {
          results[compatibility] = rCache[type][compatibility];
        }
      });
    });
    res.setHeader('Content-Language', req.language);
    res.json(results);
  })
);

module.exports = router;
