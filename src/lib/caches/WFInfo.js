import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { create } from 'flat-cache';
import { CronJob } from 'cron';

import Logger from '../logger.js';
import settings, { wfInfo } from '../settings.js';
import { TWO_HOURS } from '../times.js';

const { filteredItems: filteredItemsSrc, prices: pricesSrc } = wfInfo;

export default class WFInfoCache {
  static #cache;

  static #load() {
    WFInfoCache.#cache = create({
      cacheId: '.wfinfo',
      cacheDir: resolve(dirname(fileURLToPath(import.meta.url)), '../../../'),
    });
  }

  static async #hydrate(logger = Logger('WFINFO')) {
    if (!this.#cache) this.#load();

    const start = Date.now();
    // WF Info caches
    if (Date.now() - (this.#cache.getKey('last_updt') || 0) >= TWO_HOURS / 2) {
      if (filteredItemsSrc) {
        const itemsRes = await fetch(filteredItemsSrc);
        const itemsRaw = await itemsRes.text();
        try {
          const d = JSON.parse(itemsRaw);
          this.#cache.setKey('filteredItems', d);
        } catch (e) {
          logger.error(`Failed to update wfinfo filtered items`, e);
        }
      }
      if (pricesSrc) {
        const pricesRes = await fetch(pricesSrc);
        const pricesRaw = await pricesRes.text();
        try {
          const d = JSON.parse(pricesRaw);
          this.#cache.setKey('prices', d);
        } catch (e) {
          logger.error(`Failed to update wfinfo Prices`, e);
        }
      }
      this.#cache.setKey('last_updt', Date.now());
      this.#cache.save(true);

      const end = Date.now();
      logger.info(`WFInfo Hydration complete in ${end - start}ms`);
    }
  }

  static {
    this.#load();
    // eslint-disable-next-line no-new
    new CronJob(
      '0 5 * * * *',
      /* istanbul ignore next */
      () => {
        /* istanbul ignore next */
        WFInfoCache.#load();
      },
      undefined,
      true
    );
  }

  static get items() {
    if (settings.wfInfo.filteredItems) {
      return this.#cache.getKey('filteredItems');
    }
    return undefined;
  }

  static get prices() {
    if (settings.wfInfo?.prices) {
      return this.#cache.getKey('prices');
    }
    return undefined;
  }

  static populate(logger = Logger('WFINFO')) {
    return this.#hydrate(logger);
  }
}
