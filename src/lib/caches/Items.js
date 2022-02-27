'use strict';

const path = require('path');
const flatCache = require('flat-cache');
const Job = require('cron').CronJob;
const hydrate = require('../hydrate');

const FOUR_HOURS = 14400000;

module.exports = class ItemsCache {
  static #cache = flatCache.load('.items', path.resolve(__dirname, '../../../'));

  static {
    const lastUpdate = ItemsCache.#cache.getKey('last_updt');
    if (!lastUpdate || ((Date.now() - lastUpdate) > FOUR_HOURS)) {
      hydrate();
    }
    const hydration = new Job('0 0 */2 * * *', hydrate, undefined, true);
    hydration.start();
  }

  /**
   * Clean up the item or array of items
   * @param {module:warframe-items.Item | Array<module:warframe-items.Item>} result
   *  result or array of results to clean up
   * @param {Array<string>} only keys to keep on object
   * @param {Array<string>} remove keys to remove on object
   * @private
   * @returns {module:warframe-items.Item | Array<module:warframe-items.Item>}
   */
  static #cleanup(result, { only, remove }) {
    if (!result) return undefined;
    if (!(only || remove)) return result;
    if (Array.isArray(result)) {
      return result
        .map((subr) => ItemsCache
          .#cleanup(subr, { only, remove }));
    }

    const clone = { ...result };
    if (Array.isArray(only) && only.length) {
      Object.keys(clone).forEach((field) => {
        if (!only.includes(field)) {
          clone[field] = undefined;
        }
      });
    } else if (Array.isArray(remove) && remove.length) {
      remove.forEach((field) => {
        clone[field] = undefined;
      });
    }
    return clone;
  }

  /**
   * Wrapping function for all logic around getting a value from the cache
   * @param {string} key data section to fetch from
   * @param {string} language locale to fetch data for
   * @param {string} by object field to search by
   * @param {Array<string>} remove keys to remove from the object
   * @param {Array<string>} only keys to preserve on the object
   * @param {string} term search term on the object
   * @param {number} max maximum allowed amount (changes matching algorithm)
   * @returns {module:warframe-items.Item[]}
   */
  static get(key, language, {
    by = 'name', remove, only, term, max,
  }) {
    const base = ItemsCache.#cache.getKey(`${language}-${key}`);
    if (!term && !(remove || only)) return base;
    let filtered = base;
    if (term && max !== 1) {
      filtered = base
        .filter((item) => item && item[by])
        .map((item) => {
          if (!(item && item[by])) return null;
          if (item[by].toLowerCase().includes(term.toLowerCase())) {
            return item;
          }
          return null;
        })
        .filter((a) => a)
        .flat();
    }
    if (term && max === 1) {
      let keyDistance;
      let exact = false;
      filtered = undefined;
      base.filter((item) => item && item[by]).forEach((item) => {
        if (item[by].toLowerCase() === term.toLowerCase()) {
          filtered = item;
          exact = true;
        }

        if (item[by].toLowerCase().includes(term.toLowerCase()) && !exact) {
          const distance = item[by].toLowerCase().replace(term.toLowerCase(), '').length;
          if (!keyDistance || distance < keyDistance) {
            keyDistance = distance;
            filtered = item;
          }
        }
      });
    }
    return this.#cleanup(filtered, { remove, only });
  }
};
