'use strict';

const express = require('express');
const { worldState } = require('../lib/utilities');

const router = express.Router();
router.get('/', (req, res) => {
  res.json(worldState.getRss());
});

module.exports = router;
