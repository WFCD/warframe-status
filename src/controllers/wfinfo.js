import express from 'express';
import flatCache from 'flat-cache';
import { resolve } from 'node:path';
import { CronJob } from 'cron';

import { dirname } from 'path';
import { fileURLToPath } from 'url';
import Settings from '../lib/settings.js';
import { cache, ah } from '../lib/utilities.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const router = express.Router();
let infoCache;

router.use((req, res, next) => {
  if (!infoCache) infoCache = flatCache.load('.wfinfo', resolve(__dirname, '../../'));
  next();
});

router.get(
  '/filtered_items/?',
  cache('1 hour'),
  ah(async (req, res) => {
    if (Settings.wfInfo?.filteredItems) {
      return res.status(200).json(infoCache.getKey('filteredItems'));
    }
    return res.status(503).json({ code: 503, error: 'WFInfo Data Services Unavailable' });
  })
);

router.get(
  '/prices/?',
  cache('1 hour'),
  ah(async (req, res) => {
    if (Settings.wfInfo?.prices) {
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
    infoCache = flatCache.load('.wfinfo', resolve(__dirname, '../../'));
  },
  undefined,
  true
);

export default router;
