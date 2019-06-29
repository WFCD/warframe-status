'use strict';

const {
  emit, between, lastUpdated, fromNow,
} = require('../wsSocketUtils');

module.exports = (cycleData, deps) => {
  const packet = {
    ...deps,
    data: cycleData,
    eventKey: `${deps.key.replace('Cycle', '')}.${cycleData.state}`,
  };

  const last = new Date(lastUpdated[deps.platform][deps.language]);
  const activation = new Date(cycleData.activation);
  const start = new Date(deps.cycleStart);

  if (between(last, activation, start)) {
    emit(packet);
  }

  const timePacket = {
    ...packet,
    eventKey: `${packet.eventKey}.${Math.round(fromNow(deps.data.expiry) / 60000)}`,
  };
  emit(timePacket);
};
