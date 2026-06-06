import { Inject, Injectable } from '@nestjs/common';
import type { Cache } from 'cache-manager';
import JSON5 from 'json5';
import { type LoggerService, LogScope } from './logger.service';

const FOUR_HOURS = 14400000;
const PLATFORMS = ['pc', 'ps4', 'xb1', 'swi'] as const;

export type Platform = (typeof PLATFORMS)[number];

/**
 * Riven statistics for a specific item
 */
export interface RivenStat {
  itemType: string;
  compatibility: string;
  rerolled: boolean;
  avg: number;
  stddev: number;
  min: number;
  max: number;
  pop: number;
  median: number;
}

/**
 * Riven compatibility data (rerolled vs unrolled)
 */
export interface Compatibility {
  rerolled?: RivenStat;
  unrolled?: RivenStat;
}

/**
 * Riven data grouped by item type and compatibility
 */
export interface ItemType {
  [compatibility: string]: Compatibility;
}

/**
 * All riven data grouped by item type
 */
export interface RivenData {
  [itemType: string]: ItemType;
}

/**
 * RivensCacheService manages riven disposition and pricing data
 * Matches Express behavior from src/lib/caches/Rivens.js
 */
@Injectable()
export class RivensCacheService {
  private logger: LoggerService;
  private lastUpdate = 0;

  constructor(
    @Inject('LOGGER_SERVICE') loggerService: LoggerService,
    @Inject('CACHE_STORE_RIVENS') private readonly cache: Cache,
  ) {
    this.logger = loggerService;
    this.logger.setContext(LogScope.RIVENS);
    this.logger.setLevel('info');
  }

  async onModuleInit(): Promise<void> {
    this.lastUpdate = await this.getLastUpdate();
  }

  /**
   * Populate the rivens cache from warframe.com
   * Fetches data for all platforms (pc, ps4, xb1, swi)
   * Includes TTL checking - skips if updated within 4 hours
   */
  public async populate(): Promise<void> {
    this.lastUpdate = await this.getLastUpdate();

    if (Date.now() - this.lastUpdate <= FOUR_HOURS) {
      this.logger.debug('no rivens data update needed');
      return;
    }

    this.logger.info('starting Rivens hydration');
    const start = Date.now();

    try {
      for (const platform of PLATFORMS) {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 30000);
        const response = await fetch(
          `https://www-static.warframe.com/repos/weeklyRivens${platform.toUpperCase()}.json`,
          { signal: controller.signal },
        );
        clearTimeout(timeoutId);
        const text = await response.text();
        const grouped = this.groupRivenData(text);

        await this.cache.set(platform, grouped);
      }

      this.lastUpdate = Date.now();
      await this.setLastUpdate();

      const end = Date.now();
      this.logger.info(`Rivens hydration complete in ${end - start}ms`);
    } catch (error) {
      const err = error as Error;
      this.logger.error(`Riven hydration failed: ${err.message}`, err.stack);
      throw error;
    }
  }

  /**
   * Get riven data for a platform, optionally filtered by search term
   * @param platform - Platform to fetch data for (pc, ps4, xb1, swi)
   * @param term - Optional search term to filter by compatibility name
   */
  async get(platform: Platform, term?: string): Promise<RivenData> {
    let base = await this.cache.get<RivenData>(platform);

    if (!base) {
      this.logger.error('Rivens not hydrated. Forcing hydration.');
      await this.populate();
      base = await this.cache.get<RivenData>(platform);
    }

    if (!base) {
      throw new Error(`Failed to load rivens data for platform: ${platform}`);
    }

    if (!term) {
      return base;
    }

    // Filter by compatibility name
    const filtered: RivenData = {};
    const lowerTerm = term.toLowerCase();

    for (const type of Object.keys(base)) {
      for (const compatibility of Object.keys(base[type])) {
        if (compatibility.toLowerCase().includes(lowerTerm)) {
          if (!filtered[type]) {
            filtered[type] = {};
          }
          filtered[type][compatibility] = base[type][compatibility];
        }
      }
    }

    return filtered;
  }

  /**
   * Group and parse riven data from raw API response
   */
  private groupRivenData(cacheStrData: string): RivenData {
    if (!cacheStrData.length) {
      return {};
    }

    // Clean up the data (remove NaN and warnings)
    const stripped = cacheStrData
      .replace(/NaN/g, '0')
      .replace(/WARNING:.*\n/, '');
    const parsed = JSON5.parse(stripped) as RivenStat[];

    const byType: RivenData = {};

    for (const rivenD of parsed) {
      // Set compatibility for veiled rivens
      if (!rivenD.compatibility) {
        rivenD.compatibility = `Veiled ${rivenD.itemType}`;
      }

      // Clean up compatibility string
      rivenD.compatibility = this.titleCase(
        rivenD.compatibility.replace('<ARCHWING>', '').trim(),
      );

      // Initialize nested structures
      if (!byType[rivenD.itemType]) {
        byType[rivenD.itemType] = {};
      }
      if (!byType[rivenD.itemType][rivenD.compatibility]) {
        byType[rivenD.itemType][rivenD.compatibility] = {
          rerolled: undefined,
          unrolled: undefined,
        };
      }

      // Store the riven data
      byType[rivenD.itemType][rivenD.compatibility][
        rivenD.rerolled ? 'rerolled' : 'unrolled'
      ] = rivenD;
    }

    return byType;
  }

  /**
   * Convert string to title case
   */
  private titleCase(str: string): string {
    return str.toLowerCase().replace(/\b\w/g, (l) => l.toUpperCase());
  }

  private async getLastUpdate(): Promise<number> {
    const lastUpdate = await this.cache.get<number>('last_updt');
    return lastUpdate ?? 0;
  }

  private async setLastUpdate(): Promise<void> {
    await this.cache.set('last_updt', this.lastUpdate);
  }
}
