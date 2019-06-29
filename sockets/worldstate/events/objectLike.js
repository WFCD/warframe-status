'use strict';

const { emit, between, lastUpdated, logger } = require('../wsSocketUtils');

module.exports = (data, deps) => {
  if (!data) return;
  const last = new Date(lastUpdated[deps.platform][deps.language]);
  const activation = new Date(data.activation);
  const start = new Date(deps.cycleStart);

  if (between(last, activation, start)
  /* || ['kuva', 'nightwave', 'arbitration'].includes(deps.key.toLowerCase()) */
  ) {
    if (deps.key.toLowerCase() === 'kuva') {
      logger.error(`we got a live one: ${JSON.stringify(deps.data)}`)
    }
    const packet = {
      ...deps,
      data,
      eventKey: deps.eventKey || deps.key,
    };
    emit(packet);
  }
};
