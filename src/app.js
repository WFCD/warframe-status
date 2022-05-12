'use strict';

// eslint-disable-next-line import/no-extraneous-dependencies
/* istanbul ignore next */ if (process.env.NODE_ENV === 'development' || process.env.NODE_ENV === 'test') require('dotenv').config();

const express = require('express');

const app = express();
const addons = require('./lib/addons');

const { logger } = require('./lib/utilities');

/* istanbul ignore next */ if (!global.__basedir) {
  global.__basedir = __dirname;
}

// middleware
app.use(express.json());
addons.init(app);

// actual api routes
logger.info('Setting up routes...');
app.use(require('./controllers'));

// oh no, nothing...fallback catch-all
app.use((req, res) => {
  res.status(404).json({ error: 'No such route.', code: 404 }).end();
});
logger.info('Routes up');

module.exports = app;
