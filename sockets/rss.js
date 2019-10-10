'use strict';

const { socketLogger: logger } = require('../lib/utilities');
const rss = require('../lib/caches/RSSSocketEmitter');

const rssSock = (socket) => {
  rss.on('new-rss', (rssItem) => {
    logger.verbose(`Emitting 'rss' to ${socket.id}: ${rssItem.timestamp}`);
    socket.emit('rss', rssItem);
  });
};

module.exports = rssSock;
