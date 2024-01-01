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
      if (ws.isAlive === false) return ws.terminate();

      ws.isAlive = false;
      ws.ping(noop);
      return 0;
    });
  }, 30000);

  wss.on('close', () => clearInterval(interval));
  wss.on('pong', () => socketLogger.debug('pong!'));
};

export default init;
