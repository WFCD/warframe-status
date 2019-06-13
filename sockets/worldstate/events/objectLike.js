'use strict';

const { emit, between, lastUpdated } = require('../wsSocketUtils');

module.exports = (data, deps) => {
  const last = new Date(lastUpdated[deps.platform][deps.language]);
  const activation = new Date(data.activation);
  const start = new Date(deps.cycleStart);
  if (between(last, activation, start)
  /* || ['kuva', 'nightwave', 'arbitration'].includes(deps.key.toLowerCase()) */
  ) {
    const packet = {
      ...deps,
      data,
      eventKey: deps.eventKey || deps.key,
    };
    emit(packet);
  }
};
