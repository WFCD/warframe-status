import WebSocket from 'ws';
import { socketLogger as logger, worldState } from './lib/utilities.js';
import Settings from './lib/settings.js';
import handler from './sockets/index.js';
import heartbeater from './sockets/beater.js';

const { host, port } = Settings;

const init = (server) => {
  const wss = new WebSocket.Server({ server, path: '/socket' });

  const broadcast = (event, packet) => {
    wss.clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(JSON.stringify({ event, packet }));
      }
    });
  };

  heartbeater(wss);
  wss.on('connection', handler);
  wss.on('error', logger.error);

  // subscribable events
  worldState.on('tweet', (packet) => broadcast('tweet', packet));
  worldState.on('rss', (packet) => broadcast('rss', packet));
  worldState.on('ws:update:event', (packet) => {
    broadcast('ws:event', packet);
    broadcast(packet.key, packet);
  });
  worldState.on('ws:update:parsed', (packet) => broadcast('ws:update', packet));

  logger.info(`Started listening on wss://${host}:${port}/socket`);
};

export default init;
