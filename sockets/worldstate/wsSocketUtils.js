'use strict';

const { socketLogger: logger } = require('../../lib/utilities');


/**
 * Validate that b is between a and c
 * @param  {Date} a The first Date, should be the last time things were updated
 * @param  {Date} b The second Date, should be the activation time of an event
 * @param  {Date} c The third Date, should be the start time of this update cycle
 * @returns {boolean}   if b is between a and c
 */
const between = (a, b, c = new Date()) => ((b > a) && (b < c));

/**
 * Emit an ws event with common emit event
 * @param  {Object}          data     worldstate data to emit
 * @param  {string}          key      key of worldstate
 * @param  {string}          platform platform it was emitted for
 * @param  {string}          language language it was emitted for
 * @param  {SocketIO.Server} socket   socket to emit from
 * @param  {string}          eventKey special key, such as `enemies.departed`
 */
const emit = ({
  data, key, platform, language, socket, eventKey,
}) => {
  logger.debug(`emitting ${key} as ${eventKey} for ${language}`);
  socket.emit('ws', {
    event: key, platform, language, data, eventKey,
  });
};

/**
 * Returns the number of milliseconds between now and a given date
 * @param   {string} d         The date from which the current time will be subtracted
 * @param   {function} [now] A function that returns the current UNIX time in milliseconds
 * @returns {number}
 */
function fromNow(d, now = Date.now) {
  return new Date(d).getTime() - now();
}

/**
 * Map of last updated dates/times
 * @type {Object}
 */
const lastUpdated = {
  pc: {
    en: Date.now(),
  },
  ps4: {
    en: Date.now(),
  },
  xb1: {
    en: Date.now(),
  },
  swi: {
    en: Date.now(),
  },
};

module.exports = {
  between, emit, lastUpdated, fromNow, logger,
};
