'use strict';

const http = require('http');
const app = require('./src/app');
const makeSocket = require('./src/socket');
const { host, port } = require('./src/lib/settings');

const server = http.createServer(app);
makeSocket(server);
server.listen(port, host);
