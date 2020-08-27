'use strict';

// Some dependency/config stuff
const port = process.env.PORT || 3001;
const host = process.env.HOSTNAME || process.env.HOST || process.env.IP || 'localhost';

const server = require('./server');
require('./socket')(server);

server.listen(port, host);
