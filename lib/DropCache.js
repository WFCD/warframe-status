'use strict';

const FetchCache = require('json-fetch-cache'); // eslint-disable-line import/no-unresolved

const allDataCache = new FetchCache('https://drops.warframestat.us/data/all.json', 86400000);

/**
 * Copy of #formatData from https://github.com/WFCD/warframe-drop-data/blob/gh-pages/index.html
 * @param {Object} data unformatted json data
 * @returns {Array.<JSON>}
 */
function formatData(data) {
  const newData = [];
  // mission rewards
  // planets
  Object.keys(data.missionRewards).forEach((planetName) => {
    // locations
    Object.keys(data.missionRewards[planetName]).forEach((locationName) => {
      const location = data.missionRewards[planetName][locationName];
      if (Array.isArray(location.rewards)) {
        const placeName = `${planetName}/${locationName} (${location.gameMode})`;
        location.rewards.forEach((reward) => {
          newData.push({
            place: placeName,
            item: reward.itemName,
            rarity: reward.rarity,
            chance: reward.chance,
          });
        });
      } else {
        Object.keys(location.rewards).forEach((key) => {
          const placeName = `${planetName}/${locationName} (${location.gameMode}), Rotation ${key}`;
          location.rewards[key].forEach((reward) => {
            newData.push({
              place: placeName,
              item: reward.itemName,
              rarity: reward.rarity,
              chance: reward.chance,
            });
          });
        });
      }
    });
  });

  // blueprint locations
  data.blueprintLocations.forEach((blueprint) => {
    blueprint.enemies.forEach((enemy) => {
      newData.push({
        place: enemy.enemyName,
        item: blueprint.blueprintName,
        rarity: enemy.rarity,
        chance: (((enemy.enemyBlueprintDropChance / 100)
         * (enemy.chance / 100)) * 100).toFixed(2),
      });
    });
  });

  // mod locations
  data.modLocations.forEach((mod) => {
    mod.enemies.forEach((enemy) => {
      newData.push({
        place: enemy.enemyName,
        item: mod.modName,
        rarity: enemy.rarity,
        chance: (((enemy.enemyModDropChance / 100) * (enemy.chance / 100)) * 100).toFixed(2),
      });
    });
  });

  // relics
  data.relics.forEach((relic) => {
    relic.rewards.forEach((item) => {
      newData.push({
        place: `${relic.tier} ${relic.relicName} (${relic.state})`,
        item: item.itemName,
        rarity: item.rarity,
        chance: item.chance,
      });
    });
  });

  // sortie rewards
  data.sortieRewards.forEach((sortie) => {
    newData.push({
      place: 'Sorties',
      item: sortie.itemName,
      rarity: sortie.rarity,
      chance: sortie.chance,
    });
  });

  // transient rewards
  data.transientRewards.forEach((objective) => {
    objective.rewards.forEach((reward) => {
      let rotation = '';
      if (reward.rotation) {
        rotation = ` ${reward.rotation}`;
      }
      newData.push({
        place: `${objective.objectiveName}${rotation}`,
        item: reward.itemName,
        rarity: reward.rarity,
        chance: reward.chance,
      });
    });
  });

  // Bounty Rewards
  data.cetusBountyRewards.forEach((bountyLevel, index) => {
    Object.keys(bountyLevel.rewards).forEach((rewardTier) => {
      bountyLevel.rewards[rewardTier].forEach((reward) => {
        newData.push({
          place: `Cetus - Tier ${index + 1} Rotation ${rewardTier}`,
          item: reward.itemName,
          rarity: reward.rarity,
          chance: reward.chance,
        });
      });
    });
  });

  // Key Rewards
  data.keyRewards.forEach((key) => {
    Object.keys(key.rewards).forEach((rewardKey) => {
      const rewardList = key.rewards[rewardKey];
      rewardList.forEach((reward) => {
        newData.push({
          place: `${key.keyName} ${rewardKey}`,
          item: reward.itemName,
          rarity: reward.rarity,
          chance: reward.chance,
        });
      });
    });
  });

  // Clean up some oddities in the places
  newData.forEach((reward) => {
    reward.place = reward.place.replace('Derelict/', '') // eslint-disable-line no-param-reassign
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
      .replace('Rotation ', 'Rot ');
    // eslint-disable-next-line no-param-reassign
    reward.item = reward.item.replace('Blueprint', 'BP').replace(' Prime', ' P.');
  });

  return newData;
}

class DropCache {
  constructor(logger = console) {
    this.logger = logger;
    allDataCache.getDataJson()
      .then((data) => {
        this.data = data;
        this.readyData = formatData(data);
      })
      .catch(error => this.logger.log('error', error));
  }

  async getData() {
    const data = await allDataCache.getDataJson();
    if (!this.data || this.data !== data) {
      this.data = data;
      this.readyData = formatData(data);
    }
    return this.readyData;
  }
}

module.exports = DropCache;
