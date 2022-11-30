'use strict';

const express = require('express');

const router = express.Router();
router.get('/', (req, res) => {
  res.status(200).json({ message: 'Success', code: 200 });
});

module.exports = router;
