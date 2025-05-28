import express from 'express';

import WFInfo from '../lib/caches/WFInfo.js';
import { cache, ah } from '../lib/utilities.js';

const router = express.Router();

router.get(
  ['/filtered_items/', '/filtered_items'],
  cache('1 hour'),
  ah(async (req, res) => {
    return res
      .status(WFInfo.items ? 200 : 503)
      .json(WFInfo.items || { code: 503, error: 'WFInfo Data Services Unavailable' });
  })
);

router.get(
  ['/prices/', '/prices'],
  cache('1 hour'),
  ah(async (req, res) => {
    return res
      .status(WFInfo.prices ? 200 : 503)
      .json(WFInfo.prices || { code: 503, error: 'WFInfo Data Services Unavailable' });
  })
);

export default router;
