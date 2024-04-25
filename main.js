import cluster from 'node:cluster';
import http from 'node:http';
import os from 'node:os';

import app from './src/app.js';
import makeLogger from './src/lib/logger.js';
import Settings from './src/lib/settings.js';
import makeSocket from './src/socket.js';

const { host, port, features } = Settings;
const logger = makeLogger('HTTP');
const cpus = Math.floor(os.cpus().length / 2);

if (cluster.isPrimary && cpus > 2) {
  logger.info(`Master process ${process.pid} starting up with ${cpus} workers.`);
  for (let i = 0; i < cpus; i += 1) cluster.fork();

  cluster.on('exit', (worker) => {
    logger.info(`Worker process ${worker.process.pid} died. Restarting...`);
    cluster.fork();
  });
} else {
  const server = http.createServer(app);
  if (features.includes('SOCKET')) makeSocket(server);

  logger.info(`Listening to ${host}:${port}`);
  server.listen(port, host);
}
