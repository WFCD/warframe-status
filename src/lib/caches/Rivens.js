import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { create } from 'flat-cache';

import Logger from '../logger.js';
import { platforms, titleCase } from '../utilities.js';

const FOUR_HOURS = 14400000;
const dirName = dirname(fileURLToPath(import.meta.url));

/**
 * @typedef {Object} RivenStat
 * @property {string} itemType item name of riven
 * @property {module:warframe-items.Item['name']} compatibility what item this riven is compatible with
 * @property {boolean} rerolled Whether this riven was rerolled when it was traded
 * @property {number} avg Average price it was sold for
 * @property {number} stddev Standard deviation of riven sale price
 * @property {number} min minimum sale price
 * @property {number} max maximum sale price
 * @property {number} pop Population of sale? (Not sure on this one)
 * @property {number} median median sale price
 */
/**
 * @typedef {Record<'rerolled'|'unrerolled', RivenStat>} Compatibility
 */
/**
 * @typedef {Record<string, Compatibility>} ItemType
 */

const groupRivenData = (cacheStrData) => {
  /* istanbul ignore if */ if (!cacheStrData.length) return {};
  const stripped = cacheStrData.replace(/NaN/g, 0).replace(/WARNING:.*\n/, '');
  const parsed = JSON.parse(stripped);

  const byType = {};
  parsed.forEach((rivenD) => {
    if (!rivenD.compatibility) {
      rivenD.compatibility = `Veiled ${rivenD.itemType}`;
    }

    rivenD.compatibility = titleCase(rivenD.compatibility.replace('<ARCHWING>', '').trim());

    if (!byType[rivenD.itemType]) {
      byType[rivenD.itemType] = {};
    }
    if (!byType[rivenD.itemType][rivenD.compatibility]) {
      byType[rivenD.itemType][rivenD.compatibility] = {
        rerolled: undefined,
        unrolled: undefined,
      };
    }

    byType[rivenD.itemType][rivenD.compatibility][rivenD.rerolled ? 'rerolled' : 'unrolled'] = rivenD;
  });

  return byType;
};

export default class RivensCache {
  static #cache = create({ cacheId: '.rivens', cacheDir: resolve(dirName, '../../../') });
  static #lastUpdate = this.#cache.getKey('last_updt');
  static #logger = Logger('RIVENS');

  static async populate(logger = this.#logger) {
    this.#lastUpdate = this.#cache.getKey('last_updt');
    try {
      if (typeof this.#lastUpdate === 'undefined') this.#lastUpdate = 0;
      if (Date.now() - this.#lastUpdate <= FOUR_HOURS) {
        logger.debug('no rivens data update needed');
        return;
      }
      logger.info('starting Rivens hydration');
      const start = Date.now();
      for await (const platform of platforms) {
        const raw = await fetch(`https://www-static.warframe.com/repos/weeklyRivens${platform.toUpperCase()}.json`);
        const text = await raw.text();
        this.#cache.setKey(platform, groupRivenData(text));
      }

      this.#cache.setKey('last_updt', Date.now());
      this.#cache.save(true);
      // done
      const end = Date.now();
      logger.info(`Rivens hydration complete in ${end - start}ms`);
    } catch (e) {
      logger.error(`Riven hydration failed: ${e.message}`);
    }
  }

  /**
   * Get a riven data subset, filtered if query is provided
   * @param {string} platform platform for which to fetch data
   * @param {string} [term] filtering query
   * @param {console} [logger] logger instance
   * @returns {ItemType}
   */
  static async get(platform, term, logger = this.#logger) {
    let base = RivensCache.#cache.getKey(platform);
    if (!base) {
      logger.error('Rivens not hydrated. Forcing hydration.');
      await this.populate();
      base = RivensCache.#cache.getKey(platform);
    }
    if (!term) return base;

    // Allow nested keys separated by periods
    const filtered = {};
    Object.keys(base).forEach((type) => {
      Object.keys(base[type]).forEach((compatibility) => {
        if (compatibility.toLowerCase().includes(term.toLowerCase())) {
          filtered[compatibility] = base[type][compatibility];
        }
      });
    });
    return filtered;
  }
}
