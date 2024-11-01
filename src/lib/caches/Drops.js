import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { create } from 'flat-cache';

import Logger from '../logger.js';

/**
 * Drop with chances @ location
 * @typedef {Object} Drop
 * @property {string} place
 * @property {string} item
 * @property {('common'|'uncommon'|'rare'|'legendary')} [rarity]
 * @property {number} [chance] drop chance as a decimal that the drop occurs
 * @property {'A'|'B'|'C'|'D'|'E'|'F'|'G'} [rotation] rotation the drop occurs on
 */

/**
 * Copy of #formatData from https://github.com/WFCD/warframe-drop-data/blob/gh-pages/index.html
 * @param {string} data unformatted json data
 * @returns {Array.<Drop>}
 */
const formatData = (data) =>
  JSON.parse(data).map((reward) => ({
    place: reward.place
      .replace(/<\/?b>/gi, '')
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
    item: reward.item,
    rarity: reward.rarity,
    chance: Number.parseFloat(reward.chance),
  }));

/**
 * Group drops by where they drop
 * @param {Array<Drop>} data ungrouped drop data
 * @returns {Record<string, Array<Drop>>}
 */
const groupLocation = (data) => {
  const locBase = {};
  data.forEach((reward) => {
    if (!locBase[reward.place]) {
      locBase[reward.place] = {
        rewards: [],
      };
    }
    const slimmed = { ...reward };
    delete slimmed.place;
    locBase[reward.place].rewards.push(slimmed);
  });
  return locBase;
};

let logger;
const FOUR_HOURS = 14400000;
const dirName = dirname(fileURLToPath(import.meta.url));

export default class DropsCache {
  static #cache = create({ cacheId: '.drops', cacheDir: resolve(dirName, '../../../') });
  static #lastUpdate;

  static {
    logger = Logger('DROPS');
    logger.level = 'info';
    this.#lastUpdate = DropsCache.#cache.getKey('last_updt');
  }

  static async populate() {
    this.#lastUpdate = DropsCache.#cache.getKey('last_updt');
    if (typeof this.#lastUpdate === 'undefined') this.#lastUpdate = 0;
    if (Date.now() - this.#lastUpdate <= FOUR_HOURS) {
      logger.debug('no drops data update needed');
      return;
    }
    logger.info('starting Drops hydration');
    const start = Date.now();
    const raw = await fetch('https://drops.warframestat.us/data/all.slim.json');
    const text = await raw.text();
    const formatted = formatData(text);
    this.#cache.setKey('data', formatted);

    this.#lastUpdate = Date.now();
    this.#cache.setKey('last_updt', this.#lastUpdate);

    this.#cache.save(true);
    // done
    const end = Date.now();
    logger.info(`Drops hydration complete in ${end - start}ms`);
  }

  /**
   * Get a riven data subset, filtered if query is provided
   * @param {string} [term] filtering query
   * @param {'location'} [groupedBy] field to group by
   * @returns {Promise<Array<Drop> | Record<string, Drop>>}
   */
  static async get({ term, groupedBy } = {}) {
    let base = /** @type {Array<Drop>} */ DropsCache.#cache.getKey('data');
    if (!base) {
      logger.error('Drops not hydrated. Forcing hydration.');
      await this.populate();
      base = DropsCache.#cache.getKey('data');
    }
    if (!term) return base;
    const queries = term.split(',').map((q) => q.trim().toLowerCase());
    let filtered /** @type {Array<Drop> | Record<string, Array<Drop>>} */ = [];
    queries.forEach((query) => {
      let qResults = base.filter(
        (drop) =>
          drop.place.toLowerCase().includes(query.toLowerCase()) ||
          drop.item.toLowerCase().includes(query.toLowerCase())
      );

      qResults = qResults.length > 0 ? qResults : [];

      if (groupedBy && groupedBy === 'location') {
        /* istanbul ignore if */ if (typeof filtered !== 'object') filtered = {};

        filtered = {
          ...groupLocation(qResults),
          ...filtered,
        };
      } else {
        filtered.push(...qResults);
      }
    });
    return filtered;
  }
}
