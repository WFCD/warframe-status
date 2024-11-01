import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { create } from 'flat-cache';
import Items from 'warframe-items';
import data from 'warframe-worldstate-data';

import Logger from '../logger.js';

let logger;

const FOUR_HOURS = 14400000;
const dirName = dirname(fileURLToPath(import.meta.url));
const i18nOnObject = true;
const caches = ['weapons', 'warframes', 'items', 'mods'];

/**
 * @typedef ItemFilter
 * @property {string} key key to filter by, dot-separated for nested keys
 * @property {string} value value to filter by
 */

/**
 * Cache object
 * @typedef {Object} ItemCache
 * @property {Array<module:warframe-items.Item>} weapons
 * @property {Array<module:warframe-items.Item>} warframes
 * @property {Array<module:warframe-items.Item>} items
 * @property {Array<module:warframe-items.Item>} mods
 */

/**
 * Generate a Cache object for a specified language
 * @param {string} language one of {module:warframe-worldstate-data.locales}
 * @returns {ItemCache}
 */
const makeLanguageCache = (language) => {
  const base = {
    weapons: new Items({
      category: ['Primary', 'Secondary', 'Melee', 'Arch-Melee', 'Arch-Gun'],
      i18n: language,
      i18nOnObject,
    }),
    warframes: new Items({
      category: ['Warframes', 'Archwing'],
      i18n: language,
      i18nOnObject,
    }),
    items: new Items({
      i18n: language,
      i18nOnObject,
    }),
    mods: new Items({
      category: ['Mods'],
      i18n: language,
      i18nOnObject,
    }),
  };
  const merged = {};
  caches.forEach((cacheType) => {
    const subCache = base[cacheType];
    merged[cacheType] = [...subCache].map((item) => {
      let itemClone = { ...item };
      if (language !== 'en' && itemClone.i18n && itemClone.i18n[language]) {
        // Abilties are always sorted from first to fourth ability so using the index is safe
        // Thanks DE :)
        itemClone.i18n[language].abilities = itemClone.i18n[language].abilities?.map((ability, index) => ({
          uniqueName: ability.abilityUniqueName || itemClone.abilities[index].uniqueName || undefined,
          name: ability.abilityName || itemClone.abilities[index].name || undefined,
          description: ability.description || itemClone.abilities[index].description || undefined,
          imageName: itemClone.abilities[index].imageName ?? undefined,
        }));

        itemClone = {
          ...itemClone,
          ...itemClone.i18n[language],
        };
      }

      delete itemClone.i18n;
      return itemClone;
    });
  });
  return merged;
};

export default class ItemsCache {
  static #cache = create({ cacheId: '.items', cacheDir: resolve(dirName, '../../../') });
  static #lastUpdate = 0;

  static {
    logger = Logger('ITEMS');
    logger.level = 'info';
    this.#lastUpdate = ItemsCache.#cache.getKey('last_updt');
  }

  static async populate() {
    this.#lastUpdate = ItemsCache.#cache.getKey('last_updt');
    if (typeof this.#lastUpdate === 'undefined') this.#lastUpdate = 0;
    if (Date.now() - this.#lastUpdate <= FOUR_HOURS) {
      logger.debug('No items update needed');
      return;
    }
    data.locales.forEach((language) => {
      const cacheForLang = makeLanguageCache(language);
      caches.forEach((cacheType) => {
        this.#cache.setKey(`${language}-${cacheType}`, cacheForLang[cacheType]);
      });
    });
    this.#cache.setKey('last_updt', Date.now());
    this.#cache.save(true);
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
   * Filter an array of items by a set of filters
   * @param {Item[]} array array of items to filter
   * @param {ItemFilter[]} filters array of filters to apply
   * @returns {Item[]}
   */
  static #filterArray(array, filters) {
    let filtered = array;
    filters.forEach(({ key, value }) => {
      const bys = key.split('.');
      filtered = filtered
        .filter((item) => key && this.#parseNestedKey(item, bys))
        .filter((item) => {
          const values = this.#parseNestedKey(item, bys);
          if (!(item && values)) return undefined;
          // parseNestedKey returns an array, so check all values in that array
          if (values.find((entry) => entry.toString().toLowerCase().includes(value.toString().toLowerCase()))) {
            return item;
          }
          return undefined;
        })
        .filter(Boolean)
        .flat(Infinity);
    });
    return filtered;
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
   * @param {ItemFilter[]} filter array of filters to apply
   * @returns {Promise<module:warframe-items.Item[]>}
   */
  static async get(key, language, { by = 'name', remove, only, term, max, filter }) {
    let base = ItemsCache.#cache.getKey(`${language}-${key}`);
    if (!term && !(remove || only)) return base;
    if (!base) {
      logger.error('Items not hydrated. Forcing hydration.');
      await this.populate();
      base = ItemsCache.#cache.getKey(`${language}-${key}`);
    }
    // Allow nested keys separated by periods
    const bys = by.split('.');
    let filtered = base;
    if (filter) {
      filtered = this.#filterArray(filtered, filter);
    }
    if (term && max !== 1) {
      filtered = this.#filterArray(base, [{ key: by, value: term }]);
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
