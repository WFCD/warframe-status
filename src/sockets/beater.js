import { socketLogger } from '../lib/utilities.js';

const noop = () => {};

function heartbeat() {
  this.isAlive = true;
}

const init = (wss) => {
  wss.on('connection', (ws) => {
    ws.isAlive = true;
    ws.on('pong', heartbeat);
  });

  const interval = setInterval(() => {
    wss.clients.forEach((ws) => {
      if (ws.isAlive === false) {
        ws.terminate();
        return;
      }

      ws.isAlive = false;
      ws.ping(noop);
    });
  }, 30000);

  wss.on('close', () => clearInterval(interval));
  wss.on('pong', () => socketLogger.debug('pong!'));
};

export default init;
