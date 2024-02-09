import express from 'express';

import { cache, ah, worldState } from '../lib/utilities.js';
import { twitter } from '../lib/settings.js';

const router = express.Router();

router.get(
  '/',
  cache('1 minute'),
  ah(async (req, res) => {
    /* istanbul ignore if */
    if (twitter.active) {
      const twd = await worldState.getTwitter();
      return res.status(200).json(twd);
    }
    return res.status(404).json({ code: 404, error: 'No Twitter Data' });
  })
);

export default router;
