import express from 'express';
import flatCache from 'flat-cache';
import { resolve, dirname } from 'node:path';
import { CronJob } from 'cron';

import { fileURLToPath } from 'node:url';
import { wfInfo } from '../lib/settings.js';
import { cache, ah } from '../lib/utilities.js';

const DIRNAME = dirname(fileURLToPath(import.meta.url));
const router = express.Router();
let infoCache;

router.use((req, res, next) => {
  if (!infoCache) infoCache = flatCache.load('.wfinfo', resolve(DIRNAME, '../../'));
  next();
});

router.get(
  '/filtered_items/?',
  cache('1 hour'),
  ah(async (req, res) => {
    if (wfInfo?.filteredItems) {
      return res.status(200).json(infoCache.getKey('filteredItems'));
    }
    return res.status(503).json({ code: 503, error: 'WFInfo Data Services Unavailable' });
  })
);

router.get(
  '/prices/?',
  cache('1 hour'),
  ah(async (req, res) => {
    if (wfInfo?.prices) {
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
    infoCache = flatCache.load('.wfinfo', resolve(DIRNAME, '../../'));
  },
  undefined,
  true
);

export default router;
