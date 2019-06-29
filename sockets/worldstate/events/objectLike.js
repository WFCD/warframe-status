'use strict';

const { emit, between, lastUpdated } = require('../wsSocketUtils');

module.exports = (data, deps) => {
  if (!data) return;
  const last = new Date(lastUpdated[deps.platform][deps.language]);
  const activation = new Date(data.activation);
  const start = new Date(deps.cycleStart);

  if (between(last, activation, start)) {
    const packet = {
      ...deps,
      data,
      eventKey: deps.eventKey || deps.key,
    };
    emit(packet);
  }
};
