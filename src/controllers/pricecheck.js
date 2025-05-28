import express from 'express';
import Nexus from 'warframe-nexus-query';

import settings from '../lib/settings.js';
import { logger, ah, cache, noResult } from '../lib/utilities.js';

const router = express.Router();
const unavailable = {
  error: 'Service temporarily unavailable',
  code: 503,
};
const nexusQuerier = new Nexus({ logger, skipNexus: true });

router.use((req, res, next) => {
  req.platform = req.get('platform');
  next();
});

router.get(
  ['/:type/:query/', '/:type/:query'],
  cache('1 hour'),
  ah(async (req, res) => {
    if (!settings.priceChecks) {
      return res.status(503).json(unavailable);
    }
    let value;
    try {
      switch (req.params.type) {
        case 'string':
          value = await nexusQuerier.priceCheckQueryString(req.params.query, undefined, req.platform);
          break;
        case 'find':
          value = await nexusQuerier.priceCheckQuery(req.params.query, req.platform);
          break;
        case 'attachment':
          value = await nexusQuerier.priceCheckQueryAttachment(req.params.query, undefined, req.platform);
          break;
      }
      /* istanbul ignore else */
      if (value) {
        return res.status(200).json(value);
      }
      /* istanbul ignore next */
      return noResult(res);
    } catch (error) /* istanbul ignore next */ {
      logger.error(error);
      return res.status(500).json({
        error: `An error ocurred pricechecking \`${req.params.query}\``,
        code: 500,
      });
    }
  })
);

export default router;
