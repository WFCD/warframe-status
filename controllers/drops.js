'use strict';

const express = require('express');
const Cache = require('json-fetch-cache');

const {
  logger, setHeadersAndJson, cache, ah,
} = require('../lib/utilities');

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

const router = express.Router();

const groupLocation = (data) => {
  const locBase = {};
  data.forEach((reward) => {
    if (!locBase[reward.place]) {
      locBase[reward.place] = {
        rewards: [],
      };
    }
    const slimmed = Object.assign({}, reward);
    delete slimmed.place;
    locBase[reward.place].rewards.push(slimmed);
  });
  return locBase;
};

const dropCache = new Cache('https://drops.warframestat.us/data/all.slim.json', 43200000, { parser: formatData });

router.get('/', cache('24 hours'), ah(async (req, res) => {
  logger.silly(`Got ${req.originalUrl}`);
  setHeadersAndJson(res, await dropCache.getData());
}));

router.get('/search/:query', cache('1 hour'), ah(async (req, res) => {
  logger.silly(`Got ${req.originalUrl}`);
  const drops = await dropCache.getData();
  const queries = req.params.query.split(',').map(q => q.trim());
  let results = [];
  queries.forEach((query) => {
    let qResults = drops
      .filter(drop => drop.place.toLowerCase().includes(query.toLowerCase())
      || drop.item.toLowerCase().includes(query.toLowerCase()));

    qResults = qResults.length > 0 ? qResults : [];

    if (req.query.grouped_by && req.query.grouped_by === 'location') {
      if (typeof results !== 'object') {
        results = {};
      }

      results = {
        ...groupLocation(qResults),
        ...results,
      };
    } else {
      results.push(...qResults);
    }
  });

  setHeadersAndJson(res, results);
}));

module.exports = router;
