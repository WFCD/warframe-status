'use strict';

const express = require('express');

const router = express.Router();

const { cache, ah, worldState } = require('../lib/utilities');
const Settings = require('../lib/settings');

router.get(
  '/',
  cache('1 minute'),
  ah(async (req, res) => {
    /* istanbul ignore if */
    if (Settings.twitter.active) {
      const twd = await worldState.getTwitter();
      return res.status(200).json(twd);
    }
    return res.status(404).json({ code: 404, error: 'No Twitter Data' });
  })
);

module.exports = router;
