'use strict';

const { host, port, features } = require('./src/lib/settings');

// manually delay startup to try to let host populate/resolve
setTimeout(() => {
  const http = require('http');
  const app = require('./src/app');
  const makeSocket = require('./src/socket');
  const logger = require('./src/lib/logger')('HTTP');

  const server = http.createServer(app);
  if (features.includes('SOCKET')) makeSocket(server);

  logger.info(`Listening to ${host}:${port}`);
  server.listen(port, host);
}, 10000);
