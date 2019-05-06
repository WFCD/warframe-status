'use strict';

const express = require('express');
const helmet = require('helmet');

const { logger } = require('./lib/utilities');

if (!global.__basedir) {
  global.__basedir = __dirname;
}

logger.info('Setting up dependencies...');

const app = express();

if (process.env.SENTRY_DSN) {
  // eslint-disable-next-line global-require
  const Raven = require('raven');
  Raven.config(process.env.SENTRY_DSN).install();
  app.use(Raven.requestHandler());
  app.use(Raven.errorHandler());
}

app.use(helmet());
app.use(express.json());

logger.info('Setting up routes...');
app.use(require('./controllers'));

// oh no, nothing
app.use((req, res) => {
  res.status(404).json({ error: 'No such route.', code: 404 }).end();
});

const port = process.env.PORT || 3001;
const host = process.env.HOSTNAME || process.env.HOST || process.env.IP || 'localhost';
app.listen(port, host);

logger.info(`Started listening on ${host}:${port}`);
