'use strict';

const router = require('express').Router();

const {
  logger, cache, platforms, warframeData, platformAliases,
} = require('../lib/utilities');

router.get('/', cache('1 minute'), (req, res) => {
  logger.silly(`Got ${req.originalUrl}`);
  res.json({ code: 200, message: 'OK' });
});

router.use(`/:platform(${platforms.join('|')}|${platformAliases.join('|')})`, require('./worldstate'));
router.use(`/:data(${Object.keys(warframeData).join('|')})`, require('./staticWfData'));
router.use('/pricecheck', require('./pricecheck'));
router.use('/heartbeat', require('./heartbeat'));
router.use('/warframes', require('./wfItems'));
router.use('/weapons', require('./wfItems'));
router.use('/twitter', require('./twitter'));
router.use('/items', require('./wfItems'));
router.use('/mods', require('./wfItems'));
router.use('/drops', require('./drops'));
router.use('/rss', require('./rss'));

module.exports = router;
