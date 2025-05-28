import express from 'express';

import RivensCache from '../lib/caches/Rivens.js';
import { ah, platforms, trimPlatform } from '../lib/utilities.js';

const router = express.Router({ strict: true });

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
    const results = await RivensCache.get(req.platform);
    res.setHeader('Content-Language', req.language);
    res.json(results);
  })
);

router.get(
  ['/search/:query/', '/search/:query'],
  /* cache('10 hours'), */ ah(async (req, res) => {
    if (res.writableEnded) return;
    const { query } = req.params;
    const results = await RivensCache.get(req.platform, query);
    res.setHeader('Content-Language', req.language);
    res.json(results);
  })
);

export default router;
