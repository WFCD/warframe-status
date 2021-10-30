'use strict';

// Some dependency/config stuff
const port = process.env.PORT || 3001;
const host = process.env.HOSTNAME || process.env.HOST || process.env.IP || 'localhost';

const app = require('./src/app');
// eslint-disable-next-line import/order
const server = require('http').createServer(app);
require('./src/socket')(server);

server.listen(port, host);
