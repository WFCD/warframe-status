'use strict';

const http = require('http');
const app = require('./src/app');
const makeSocket = require('./src/socket');
const { host, port, features } = require('./src/lib/settings');
const logger = require('./src/lib/logger')('HTTP');

const server = http.createServer(app);
if (features.includes('SOCKET')) makeSocket(server);

logger.info(`Listening to ${host}:${port}`);
server.listen(port, host);
