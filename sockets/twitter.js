'use strict';

const { socketLogger: logger } = require('../lib/utilities');
const twitter = require('../lib/caches/TwitterCache');

const twitSock = (socket) => {
  twitter.on('tweet', (tweet) => {
    logger.debug(`Emitting 'tweet' to ${socket.id}: ${tweet.uniqueId}`);
    socket.emit('tweet', tweet);
  });
};

module.exports = twitSock;
