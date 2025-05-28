import url from 'node:url';

import { Router } from 'express';

import { logger, cache, platforms, warframeData, platformAliases, languages } from '../lib/utilities.js';

import pricecheck from './pricecheck.js';
import worldstate from './worldstate.js';
import data from './data.js';
import heartbeat from './heartbeat.js';
import items from './items.js';
import twitter from './twitter.js';
import profile from './profile.js';
import drops from './drops.js';
import rss from './rss.js';
import wfinfo from './wfinfo.js';

const router = Router({ strict: true });

router.all(/^[^.]*[^/]$/, (req, res) => {
  const redir = url.parse(req.originalUrl);
  const target = `${redir.pathname}/${redir.search || ''}`;
  if (!target.includes('search')) logger.info(`redirecting to ${target}`);
  return res.redirect(301, target);
});

router.use((req, res, next) => {
  logger.silly(`Got ${req.originalUrl}`);
  next();
});

router.get('/', cache('1 minute'), (req, res) => {
  res.json({ code: 200, message: 'OK' });
});

router.use((req, res, next) => {
  req.platform = (req.url.replace('/', '').trim().split('/')[0] || /* istanbul ignore next */ '').toLowerCase();
  if (req.query.platform) req.platform = req.query.platform;
  if (req.platform === 'ns') req.platform = 'swi';
  /* istanbul ignore if */
  if (!platforms.includes(req.platform)) req.platform = 'pc';

  if (req.header('Accept-Language')?.length) res?.set('Vary', 'Accept-Language');

  req.language = (req.header('Accept-Language') || 'en').substring(0, 2).toLowerCase();
  req.language = (req.query.language || req.language).substring(0, 2);
  if (!(req.language && languages.includes(req.language))) req.language = 'en';

  next();
});

router.use(
  [...platforms, ...platformAliases].map((p) => `/${p}`),
  worldstate
);
router.use(
  Object.keys(warframeData).map((d) => `/${d}`),
  data
);
router.use('/pricecheck', pricecheck);
router.use('/heartbeat', heartbeat);
router.use(['warframes', 'weapons', 'items', 'mods'].map((itype) => [`/${itype}`, `/${itype}/`]).flat(), items);
router.use('/twitter', twitter);
router.use('/profile', profile);
router.use('/drops', drops);
router.use('/rss', rss);
router.use('/wfinfo', wfinfo);

export default router;
