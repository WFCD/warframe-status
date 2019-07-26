'use strict';

const { lastUpdated, logger } = require('./wsSocketUtils');
const { groupBy } = require('../../lib/utilities');

function fissureKey(fissure) {
  return `fissures.t${fissure.tierNum}.${(fissure.missionType || '').toLowerCase()}`;
}

function acolyteKey(acolyte) {
  return {
    eventKey: `enemies${acolyte.isDiscovered ? '' : '.departed'}`,
    activation: acolyte.lastDiscoveredAt,
  };
}

function arbiKey(arbitration) {
  if (!(arbitration && arbitration.enemy)) return '';

  let k;
  try {
    k = `arbitration.${arbitration.enemy.toLowerCase()}.${arbitration.type.replace(/\s/g, '').toLowerCase()}`;
  } catch (e) {
    logger.error(`${JSON.stringify(arbitration)}\n${e}`);
  }
  return k;
}

const eKeyOverrides = {
  events: 'operations',
  persistentEnemies: 'enemies',
  fissures: fissureKey,
  enemies: acolyteKey,
  arbitration: arbiKey,
};

const checkOverrides = (key, data) => {
  if (typeof eKeyOverrides[key] === 'string') {
    return eKeyOverrides[key];
  }
  if (typeof eKeyOverrides[key] === 'function') {
    return eKeyOverrides[key](data);
  }
  return key;
};

const parseNew = (deps) => {
  if (!lastUpdated[deps.platform][deps.language]) {
    lastUpdated[deps.platform][deps.language] = deps.cycleStart;
  }

  // anything in the eKeyOverrides goes first, then anything uniform
  switch (deps.key) {
    case 'kuva':
      if (!deps.data) break;
      const data = groupBy(deps.data, 'type');
      Object.keys(data).forEach((type) => {
        deps = {
          ...deps,
          data: data[type],
          eventKey: `kuva.${data[type][0].type.replace(/\s/g, '').toLowerCase()}`,
        };
        require('./events/objectLike')(deps.data, deps);
      });
      break;
    case 'events':
      deps = {
        ...deps,
        eventKey: eKeyOverrides[deps.key],
      };
    case 'alerts':
    case 'conclaveChallenges':
    case 'dailyDeals':
    case 'flashSales':
    case 'fissures':
    case 'globalUpgrades':
    case 'invasions':
    case 'syndicateMissions':
    case 'weeklyChallenges':
      // arrayLike are all just arrays of objectLike
      deps.data.forEach((arrayItem) => {
        const k = checkOverrides(deps.key, arrayItem);
        require('./events/objectLike')(arrayItem, {
          ...deps,
          eventKey: k,
        });
      });
      break;
    case 'cetusCycle':
    case 'earthCycle':
    case 'vallisCycle':
      // these need special logic to make sure the extra time events fire
      require('./events/cycleLike')(deps.data, deps);
      break;
    case 'sortie':
    case 'voidTrader':
    case 'arbitration':
      // pretty straightforward, make sure the activation
      //    is between the last update and current cycle start
      deps.eventKey = checkOverrides(deps.key, deps.data);
      require('./events/objectLike')(deps.data, deps);
      break;
    case 'nightwave':
      require('./events/nightwave')(deps.data, deps);
      break;
    case 'persistentEnemies':
      // uhhh, gotta find a good activation for this....
      // might just have to send it all the time?
      deps = {
        ...deps,
        ...checkOverrides(deps.key, deps.data),
      };
      require('./events/objectLike')(deps.data, deps);
    default:
      break;
  }
};

const parseEvents = ({
  socket, worldstate, platform, language = 'en',
}) => {
  const cycleStart = Date.now();
  Object.keys(worldstate).forEach(async (key) => {
    parseNew({
      data: worldstate[key], key, language, platform, socket, cycleStart,
    });
  });
  lastUpdated[platform][language] = Date.now();
};

module.exports = parseEvents;
