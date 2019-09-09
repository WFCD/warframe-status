'use strict';

const express = require('express');

const helmet = require('helmet');

const app = express();
const server = require('http').Server(app);
const io = require('socket.io')(server);

const { logger, socketLogger } = require('./lib/utilities');

if (!global.__basedir) {
  global.__basedir = __dirname;
}

logger.verbose('Setting up dependencies...');

/* Express setup */
if (process.env.SENTRY_DSN) {
  // eslint-disable-next-line global-require
  const Sentry = require('@sentry/node');
  Sentry.init({ dsn: process.env.SENTRY_DSN });
  app.use(Sentry.Handlers.requestHandler());
  app.use(Sentry.Handlers.errorHandler());
}

app.use(helmet());
app.use(express.json());

logger.verbose('Setting up routes...');
app.use(require('./controllers'));

// oh no, nothing
app.use((req, res) => {
  res.status(404).json({ error: 'No such route.', code: 404 }).end();
});

const port = process.env.PORT || 3001;
const host = process.env.HOSTNAME || process.env.HOST || process.env.IP || 'localhost';
server.listen(port, host);

socketLogger.verbose(`Started listening on ${host}:${port}`);

io.on('connection', require('./sockets'));
