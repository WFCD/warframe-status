import flatCache from 'flat-cache';
import { CronJob } from 'cron';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import hydrate from '../hydrate.js';
import Logger from '../logger.js';

let logger;

const FOUR_HOURS = 14400000;
const __dirname = dirname(fileURLToPath(import.meta.url));

export default class ItemsCache {
  static #cache = flatCache.load('.items', resolve(__dirname, '../../../'));

  static {
    logger = Logger('ITEMS');
    logger.level = 'info';
    const lastUpdate = ItemsCache.#cache.getKey('last_updt');
    if (!lastUpdate || Date.now() - lastUpdate > FOUR_HOURS) {
      hydrate();
    }
    const hydration = new CronJob('0 0 * * * *', hydrate, undefined, true);
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
      return result.map((subr) => ItemsCache.#cleanup(subr, { only, remove }));
    }

    /** @type {module:warframe-items.Item} */
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
  static get(key, language, { by = 'name', remove, only, term, max }) {
    let base = ItemsCache.#cache.getKey(`${language}-${key}`);
    if (!term && !(remove || only)) return base;
    if (!base) {
      logger.error('Items not hydrated. Forcing hydration.');
      hydrate();
      base = ItemsCache.#cache.getKey(`${language}-${key}`);
    }
    // Allow nested keys separated by periods
    const bys = by.split('.');
    let filtered = base;
    if (term && max !== 1) {
      filtered = base
        .filter((item) => item && this.#parseNestedKey(item, bys))
        .map((item) => {
          const values = this.#parseNestedKey(item, bys);
          if (!(item && values)) return undefined;
          // parseNestedKey returns an array, so check all values in that array
          if (values.find((entry) => entry.toString().toLowerCase().includes(term.toString().toLowerCase()))) {
            return item;
          }
          return undefined;
        })
        .filter((a) => a)
        .flat(Infinity);
    }
    if (term && max === 1) {
      let keyDistance;
      let exact = false;
      filtered = undefined;
      base
        .filter((item) => item && this.#parseNestedKey(item, bys))
        .forEach((item) => {
          const values = this.#parseNestedKey(item, bys);
          // parseNestedKey returns an array, so check all values in that array
          if (values.find((entry) => entry.toString().toLowerCase() === term.toString().toLowerCase())) {
            filtered = item;
            exact = true;
          }
          if (!exact) {
            // parseNestedKey returns an array, so check all values in that array
            values.forEach((entry) => {
              if (entry.toString().toLowerCase().includes(term.toString().toLowerCase())) {
                const distance = entry.toString().toLowerCase().replace(term.toString().toLowerCase(), '').length;
                if (!keyDistance || distance < keyDistance) {
                  keyDistance = distance;
                  filtered = item;
                }
              }
            });
          }
        });
    }
    return this.#cleanup(filtered, { remove, only });
  }

  /**
   * Utility function for following nested keys. Since some keys have values that are
   * an array of non-keyed objects, this function iterates over those arrays and can
   * return multiple values for a single key path.
   * @param {module:warframe-items.Item | Array<module:warframe-items.Item>} item data to search
   * @param {Array<string>} by array of keys to follow
   * @returns {Array<string> | undefined} list of results or undefined if no matching keys
   */
  static #parseNestedKey(item, by) {
    let resultList = [];

    // Walk through keys in order
    by.reduce((prevNode, currentValue, index) => {
      if (!prevNode) {
        return undefined;
      }
      // If an entry isn't found with the key, check for an array.
      // This allows a user to use 'by=components.name' and every element in the
      // components array will be checked.
      if (!prevNode[currentValue]) {
        if (Array.isArray(prevNode)) {
          resultList = Array.from(prevNode, (element) => this.#parseNestedKey(element, by.slice(index)))
            .flat(Infinity)
            .filter((element) => element); // remove falsey values
        }
      } else if (typeof prevNode[currentValue] === 'object') {
        // Key contains value that could contain more keys in the path
        return prevNode[currentValue];
      } else if (index === by.length - 1) {
        // Non Arraylike value found with key, good if it's the last key otherwise a bad key path
        resultList.push(prevNode[currentValue]);
      }
      // Return undefined unless the value of our current key is an array, reached the end of the value tree
      return undefined;
    }, item);

    return resultList.length > 0 ? resultList : undefined;
  }
}
