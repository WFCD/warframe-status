'use strict';

const Cache = require('./cache');

/**
 * Copy of #formatData from https://github.com/WFCD/warframe-drop-data/blob/gh-pages/index.html
 * @param {Object} data unformatted json data
 * @returns {Array.<JSON>}
 */
function formatData(data) {
  const parsed = JSON.parse(data).map(reward => ({
    place: reward.place
      .replace(/<\/?b>/ig, '')
      .replace('Derelict/', '')
      .replace('Assassinate (Assassination)', 'Assassinate')
      .replace('Defense (Defense)', 'Defense')
      .replace('Survival (Survival)', 'Survival')
      .replace('Teralyst (Special)', 'Teralyst (Capture)')
      .replace('Gantulyst (Special)', 'Gantulyst (Capture)')
      .replace('Hydrolyst (Special)', 'Hydrolyst (Capture)')
      .replace('The Law Of Retribution C', 'Law Of Retribution')
      .replace('The Jordas Verdict C', 'Jordas Verdict')
      .replace('The Law Of Retribution (Nightmare) C', 'Law Of Retribution (Nightmare)')
      .replace('Sanctuary/Elite Sanctuary Onslaught (Sanctuary Onslaught)', 'Elite Sanctuary Onslaught')
      .replace('Sanctuary/Sanctuary Onslaught (Sanctuary Onslaught)', 'Sanctuary Onslaught')
      .replace('/Lunaro Arena (Conclave)', '/Lunaro')
      .replace('/Lunaro Arena (Extra) (Conclave)', '/Lunaro')
      .replace('Variant Cephalon Capture (Conclave)', 'Variant Cephalon Capture')
      .replace('Variant Cephalon Capture (Extra) (Conclave)', 'Variant Cephalon Capture')
      .replace('Variant Team Annihilation (Extra) (Conclave)', 'Variant Team Annihilation')
      .replace('Variant Annihilation (Extra)', 'Variant Annihilation')
      .replace(' (Conclave)', '')
      .replace('Rotation ', 'Rot ')
      .trim(),
    item: reward.item.replace('Blueprint', 'BP').replace(' Prime', ' P.'),
    rarity: reward.rarity,
    chance: reward.chance,
  }));
  return parsed;
}

class DropCache extends Cache {
  constructor() {
    super('https://drops.warframestat.us/data/all.slim.json', 43200000, { parser: formatData });

    this.startUpdating();
  }
}

module.exports = DropCache;
