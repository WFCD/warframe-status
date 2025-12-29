import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { CronJob } from 'cron';
import { create } from 'flat-cache';

import Logger from '../logger.js';
import settings, { wfInfo } from '../settings.js';
import { TWO_HOURS } from '../times.js';

const { filteredItems: filteredItemsSrc, prices: pricesSrc } = wfInfo;

export default class WFInfoCache {
  static #cache;

  static #load() {
    WFInfoCache.#cache = create({
      cacheId: '.wfinfo',
      cacheDir: resolve(
        dirname(fileURLToPath(import.meta.url)),
        '../../../caches',
      ),
    });
  }

  static async #hydrate(logger = Logger('WFINFO')) {
    if (!WFInfoCache.#cache) WFInfoCache.#load();

    const start = Date.now();
    // WF Info caches
    if (
      Date.now() - (WFInfoCache.#cache.getKey('last_updt') || 0) >=
      TWO_HOURS / 2
    ) {
      if (filteredItemsSrc) {
        let itemsRes;
        let itemsRaw;
        try {
          itemsRes = await fetch(filteredItemsSrc);
          itemsRaw = await itemsRes.text();
        } catch (e) {
          logger.error(`Failed to fetch wfinfo filtered items`, e);
          return;
        }

        try {
          const d = JSON.parse(itemsRaw);
          WFInfoCache.#cache.setKey('filteredItems', d);
        } catch (e) {
          logger.error(`Failed to update wfinfo filtered items`, e);
        }
      }
      if (pricesSrc) {
        const pricesRes = await fetch(pricesSrc);
        const pricesRaw = await pricesRes.text();
        try {
          const d = JSON.parse(pricesRaw);
          WFInfoCache.#cache.setKey('prices', d);
        } catch (e) {
          logger.error(`Failed to update wfinfo Prices`, e);
        }
      }
      WFInfoCache.#cache.setKey('last_updt', Date.now());
      WFInfoCache.#cache.save(true);

      const end = Date.now();
      logger.info(`WFInfo Hydration complete in ${end - start}ms`);
    }
  }

  static {
    WFInfoCache.#load();
    new CronJob(
      '0 5 * * * *',
      /* istanbul ignore next */
      () => {
        /* istanbul ignore next */
        WFInfoCache.#load();
      },
      undefined,
      true,
    );
  }

  static get items() {
    if (settings.wfInfo.filteredItems) {
      return WFInfoCache.#cache.getKey('filteredItems');
    }
    return undefined;
  }

  static get prices() {
    if (settings.wfInfo?.prices) {
      return WFInfoCache.#cache.getKey('prices');
    }
    return undefined;
  }

  static populate(logger = Logger('WFINFO')) {
    return WFInfoCache.#hydrate(logger);
  }
}
