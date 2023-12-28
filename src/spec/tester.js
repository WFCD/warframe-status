'use strict';

const WebSocket = require('ws');
const { port, host } = require('../lib/settings');

const logger = require('../lib/logger')('PROC');

logger.level = 'debug';

const client = new WebSocket(`ws://${host}:${port}/socket`);

let pingTimeout;

function heartbeat() {
  clearTimeout(pingTimeout);
  pingTimeout = setTimeout(this.terminate, 30000 + 1000);
}

client.on('open', heartbeat);
client.on('ping', heartbeat);
client.on('close', () => {
  clearTimeout(pingTimeout);
});

client.on('message', (d) => {
  const packed = JSON.parse(d);
  switch (packed.event) {
    case 'ws:provide':
      logger.info(`${packed.packet.platform} ${packed.packet.language} ${packed.packet.ws.timestamp}`);
      break;
    case 'twitter:provide':
      // do nothing
      break;
    case 'rss':
      logger.info(packed.packet.title);
      break;
    case 'twitter':
      logger.info(JSON.stringify(packed.packet.text));
      break;
    case 'ws:update':
      // do nothing
      break;
    default:
      if (packed.status) {
        logger.info(`${packed.event}: ${packed.status}`);
      } else {
        logger.info(packed.event);
        logger.info(Object.keys(packed));
        // console.log(`${packed.platform} ${packed.langauge} ${packed.ws.timestamp}`);
      }
      break;
  }
});

client.on('open', () => client.send(JSON.stringify({ event: 'ws:req', packet: { platform: 'pc', language: 'en' } })));
