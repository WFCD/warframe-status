import { Inject, Injectable } from '@nestjs/common';
import type { Cache } from 'cache-manager';
import { type LoggerService, LogScope } from './logger.service';

const TWO_HOURS = 7200000;
const ONE_HOUR = TWO_HOURS / 2; // WFInfo uses half of TWO_HOURS

/**
 * WFInfoCacheService manages WFInfo filtered items and prices
 * Matches Express behavior from src/lib/caches/WFInfo.js
 *
 * Data is fetched from URLs specified in environment variables:
 * - WFINFO_FILTERED_ITEMS: URL to filtered items JSON
 * - WFINFO_PRICES: URL to prices JSON
 */
@Injectable()
export class WFInfoCacheService {
  private logger: LoggerService;
  private lastUpdate = 0;
  private readonly filteredItemsUrl?: string;
  private readonly pricesUrl?: string;

  constructor(
    @Inject('LOGGER_SERVICE') loggerService: LoggerService,
    @Inject('CACHE_STORE_WFINFO') private readonly cache: Cache,
  ) {
    this.logger = loggerService;
    this.logger.setContext(LogScope.WFINFO);
    this.logger.setLevel('info');

    this.filteredItemsUrl = process.env.WFINFO_FILTERED_ITEMS;
    this.pricesUrl = process.env.WFINFO_PRICES;
  }

  async onModuleInit(): Promise<void> {
    this.lastUpdate = await this.getLastUpdate();
  }

  /**
   * Populate the WFInfo cache from configured URLs
   * Includes TTL checking - skips if updated within 1 hour
   */
  public async populate(): Promise<void> {
    this.lastUpdate = await this.getLastUpdate();

    if (Date.now() - this.lastUpdate >= ONE_HOUR) {
      await this.hydrate();
    }
  }

  /**
   * Get filtered items data
   * Returns undefined if WFINFO_FILTERED_ITEMS env var is not set
   */
  async getFilteredItems(): Promise<unknown | undefined> {
    if (!this.filteredItemsUrl) {
      return undefined;
    }

    return await this.cache.get('filteredItems');
  }

  /**
   * Get prices data
   * Returns undefined if WFINFO_PRICES env var is not set
   */
  async getPrices(): Promise<unknown | undefined> {
    if (!this.pricesUrl) {
      return undefined;
    }

    return await this.cache.get('prices');
  }

  /**
   * Internal hydration logic
   */
  private async hydrate(): Promise<void> {
    const start = Date.now();

    // Fetch filtered items if URL is configured
    if (this.filteredItemsUrl) {
      try {
        const itemsRes = await fetch(this.filteredItemsUrl);
        const itemsRaw = await itemsRes.text();

        try {
          const data = JSON.parse(itemsRaw);
          await this.cache.set('filteredItems', data);
        } catch (error) {
          const err = error as Error;
          this.logger.error(
            'Failed to update wfinfo filtered items',
            err.stack,
          );
        }
      } catch (error) {
        const err = error as Error;
        this.logger.error('Failed to fetch wfinfo filtered items', err.stack);
        return;
      }
    }

    // Fetch prices if URL is configured
    if (this.pricesUrl) {
      try {
        const pricesRes = await fetch(this.pricesUrl);
        const pricesRaw = await pricesRes.text();

        try {
          const data = JSON.parse(pricesRaw);
          await this.cache.set('prices', data);
        } catch (error) {
          const err = error as Error;
          this.logger.error('Failed to update wfinfo Prices', err.stack);
        }
      } catch (error) {
        const err = error as Error;
        this.logger.error('Failed to fetch wfinfo Prices', err.stack);
      }
    }

    this.lastUpdate = Date.now();
    await this.setLastUpdate();

    const end = Date.now();
    this.logger.info(`WFInfo Hydration complete in ${end - start}ms`);
  }

  private async getLastUpdate(): Promise<number> {
    const lastUpdate = await this.cache.get<number>('last_updt');
    return lastUpdate ?? 0;
  }

  private async setLastUpdate(): Promise<void> {
    await this.cache.set('last_updt', this.lastUpdate);
  }
}
