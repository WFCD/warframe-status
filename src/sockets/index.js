'use strict';

const { socketLogger: logger, worldState } = require('../lib/utilities');

const safeParse = (data) => {
  try {
    return JSON.parse(data);
  } catch (e) {
    return {};
  }
};

const requestWS = ({ platform, language } = {}) => {
  if (!platform && !language) {
    return { code: 500, message: `Provided platform (${platform}) or language (${language}) not provided.` };
  }
  try {
    const ws = worldState.getWorldstate(platform, language);
    return { platform, language, ws };
  } catch (e) {
    return { code: 500, message: e.message.split('.')[0] };
  }
};

/**
 * Handle websocket requests
 * @param  {WebSocket} socket ws to handled requests for
 * @param {IncomingMessage} req incoming request
 */
const index = (socket, req) => {
  logger.info(`socket connection established with ${req.socket.remoteAddress}`);
  socket.send(JSON.stringify({ event: 'connected', status: 200 }));

  /**
   * Handle message data
   * @type {MessageEvent}
   */
  socket.on('message', (data) => {
    const request = safeParse(data);
    logger.info(`socket received request for ${request.event}`);

    switch (request.event) {
      case 'ws:req':
        socket.send(JSON.stringify({ event: 'ws:provide', packet: requestWS(request.packet) }));
        break;
      case 'twitter':
        socket.send(JSON.stringify({ event: 'twitter:provide', packet: worldState.getTwitter() }));
      case 'rss':
        socket.send(JSON.stringify({ event: 'rss:provide', packet: worldState.getRss() }));
      default:
        socket.send(JSON.stringify({ status: 400 }));
        break;
    }
  });

  socket.on('close', reason => logger.warn(`socket disconnected because ${reason}`));
  socket.on('error', logger.error);
};

module.exports = index;
