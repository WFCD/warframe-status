import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

import express from 'express';
import { create } from 'flat-cache';
import { CronJob } from 'cron';

import settings from '../lib/settings.js';
import { cache, ah } from '../lib/utilities.js';

const dirName = dirname(fileURLToPath(import.meta.url));
const router = express.Router();
let infoCache;

router.use((req, res, next) => {
  if (!infoCache) infoCache = create({ cacheId: '.wfinfo', cacheDir: resolve(dirName, '../../') });
  next();
});

router.get(
  '/filtered_items/?',
  cache('1 hour'),
  ah(async (req, res) => {
    if (settings.wfInfo?.filteredItems) {
      return res.status(200).json(infoCache.getKey('filteredItems'));
    }
    return res.status(503).json({ code: 503, error: 'WFInfo Data Services Unavailable' });
  })
);

router.get(
  '/prices/?',
  cache('1 hour'),
  ah(async (req, res) => {
    if (settings.wfInfo?.prices) {
      return res.status(200).json(infoCache.getKey('prices'));
    }
    return res.status(503).json({ code: 503, error: 'WFInfo Data Services Unavailable' });
  })
);

// eslint-disable-next-line no-new
new CronJob(
  '0 5 * * * *',
  /* istanbul ignore next */
  () => {
    /* istanbul ignore next */
    infoCache = create({ cacheId: '.wfinfo', cacheDir: resolve(dirName, '../../') });
  },
  undefined,
  true
);

export default router;
