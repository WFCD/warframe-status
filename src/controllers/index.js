'use strict';

const router = require('express').Router();

const {
  logger, cache, platforms, warframeData, platformAliases,
  languages,
} = require('../lib/utilities');

router.get('/', cache('1 minute'), (req, res) => {
  logger.silly(`Got ${req.originalUrl}`);
  res.json({ code: 200, message: 'OK' });
});

router.use((req, res, next) => {
  req.platform = (req.url.replace('/', '').trim().split('/')[0] || /* istanbul ignore next */ '').toLowerCase();
  if (req.platform === 'ns') req.platform = 'swi';
  /* istanbul ignore if */
  if (!platforms.includes(req.platform)) req.platform = 'pc';

  req.language = (req.header('Accept-Language') || 'en').substring(0, 2).toLowerCase();
  req.language = (req.query.language || req.language).substring(0, 2);
  if (!(req.language && languages.includes(req.language))) req.language = 'en';

  next();
});

router.use(`/:platform(${platforms.join('|')}|${platformAliases.join('|')})`, require('./worldstate'));
router.use(`/:data(${Object.keys(warframeData).join('|')})`, require('./data'));
router.use('/pricecheck', require('./pricecheck'));
router.use('/heartbeat', require('./heartbeat'));
router.use('/:itype(warframes|weapons|items|mods)', require('./items'));
router.use('/twitter', require('./twitter'));
router.use('/profile', require('./profile'));
router.use('/drops', require('./drops'));
router.use('/rss', require('./rss'));

module.exports = router;
