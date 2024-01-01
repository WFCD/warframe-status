import http from 'node:http';
import app from './src/app.js';
import Settings from './src/lib/settings.js';
import makeSocket from './src/socket.js';
import makeLogger from './src/lib/logger.js';

const { host, port, features } = Settings;

const logger = makeLogger('HTTP');
const server = http.createServer(app);
if (features.includes('SOCKET')) makeSocket(server);

logger.info(`Listening to ${host}:${port}`);
server.listen(port, host);
