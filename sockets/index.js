'use strict';

const { socketLogger: logger } = require('../lib/utilities');

const index = (socket) => {
  // initial connection
  socket.emit('connected', { status: 200 });
  logger.verbose(`socket ${socket.id} connected`);

  require('./worldstate')(socket);
  require('./twitter')(socket);
  require('./rss')(socket);

  socket.on('disconnect', (reason) => {
    logger.warn(`socket ${socket.id} disconnected because ${reason}`);
  });
};

module.exports = index;
