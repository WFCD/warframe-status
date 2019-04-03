'use strict';

const {
  logger, router, cache, setHeadersAndJson, wfKeys, platforms,
} = require('../lib/utilities');

router.get('/', cache('1 minute'), (req, res) => {
  logger.log('silly', `Got ${req.originalUrl}`);
  setHeadersAndJson(res, [].concat(wfKeys));
});

router.use('/heartbeat', require('./heartbeat'));
router.use('/warframes', require('./warframes'));
router.use('/weapons', require('./weapons'));
router.use('/mods', require('./mods'));
router.use('/items', require('./items'));
router.use('/drops', require('./drops'));

// TODO: still need other data routes....

router.use(`/:platform(${platforms.join('|')})`, require('./worldstate'));

module.exports = router;
