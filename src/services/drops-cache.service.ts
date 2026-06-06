import { Inject, Injectable } from '@nestjs/common';
import type { Cache } from 'cache-manager';
import { type LoggerService, LogScope } from './logger.service';

const FOUR_HOURS = 14400000;

/**
 * Drop with chances @ location
 */
export interface Drop {
  place: string;
  item: string;
  rarity?: 'common' | 'uncommon' | 'rare' | 'legendary';
  chance?: number;
  rotation?: 'A' | 'B' | 'C' | 'D' | 'E' | 'F' | 'G';
}

/**
 * Grouped drops by location
 */
export interface GroupedDrops {
  [location: string]: {
    rewards: Array<Omit<Drop, 'place'>>;
  };
}

/**
 * DropsCacheService manages drop data from warframestat.us
 * Matches Express behavior from src/lib/caches/Drops.js
 */
@Injectable()
export class DropsCacheService {
  private logger: LoggerService;
  private lastUpdate = 0;

  constructor(
    @Inject('LOGGER_SERVICE') loggerService: LoggerService,
    @Inject('CACHE_STORE_DROPS') private readonly cache: Cache,
  ) {
    this.logger = loggerService;
    this.logger.setContext(LogScope.DROPS);
    this.logger.setLevel('info');
  }

  async onModuleInit(): Promise<void> {
    this.lastUpdate = await this.getLastUpdate();
  }

  /**
   * Populate the drops cache from warframestat.us
   * Includes TTL checking - skips if updated within 4 hours
   */
  public async populate(): Promise<void> {
    this.lastUpdate = await this.getLastUpdate();

    if (Date.now() - this.lastUpdate <= FOUR_HOURS) {
      this.logger.debug('no drops data update needed');
      return;
    }

    this.logger.info('starting Drops hydration');
    const start = Date.now();

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000); // 30s timeout
      const response = await fetch(
        'https://drops.warframestat.us/data/all.slim.json',
        { signal: controller.signal },
      );
      clearTimeout(timeoutId);
      const text = await response.text();
      const formatted = this.formatData(text);

      await this.cache.set('data', formatted);

      this.lastUpdate = Date.now();
      await this.setLastUpdate();

      const end = Date.now();
      this.logger.info(`Drops hydration complete in ${end - start}ms`);
    } catch (error) {
      const err = error as Error;
      this.logger.error('Failed to hydrate Drops data', err.stack);
      throw error;
    }
  }

  /**
   * Get drop data, optionally filtered by search term
   * @param term - Comma-separated search terms for place or item
   * @param groupedBy - Group results by 'location'
   */
  async get(options?: {
    term?: string;
    groupedBy?: 'location';
  }): Promise<Drop[] | GroupedDrops> {
    let base = await this.cache.get<Drop[]>('data');

    if (!base) {
      this.logger.error('Drops not hydrated. Forcing hydration.');
      await this.populate();
      base = await this.cache.get<Drop[]>('data');
    }

    if (!base) {
      throw new Error('Failed to load drops data');
    }

    if (!options?.term) {
      return base;
    }

    const queries = options.term.split(',').map((q) => q.trim().toLowerCase());
    let filtered: Drop[] | GroupedDrops = [];

    for (const query of queries) {
      let qResults = base.filter(
        (drop) =>
          drop.place.toLowerCase().includes(query.toLowerCase()) ||
          drop.item.toLowerCase().includes(query.toLowerCase()),
      );

      qResults = qResults.length > 0 ? qResults : [];

      if (options.groupedBy === 'location') {
        if (!Array.isArray(filtered)) {
          filtered = {};
        }
        filtered = {
          ...this.groupByLocation(qResults),
          ...filtered,
        };
      } else {
        if (Array.isArray(filtered)) {
          filtered.push(...qResults);
        }
      }
    }

    return filtered;
  }

  /**
   * Format raw drop data from API
   * Copied from https://github.com/WFCD/warframe-drop-data/blob/gh-pages/index.html
   */
  private formatData(data: string): Drop[] {
    interface RawDrop {
      place: string;
      item: string;
      rarity?: 'common' | 'uncommon' | 'rare' | 'legendary';
      chance?: string | number;
      rotation?: 'A' | 'B' | 'C' | 'D' | 'E' | 'F' | 'G';
    }

    return JSON.parse(data).map(
      (reward: RawDrop): Drop => ({
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
          .replace(
            'The Law Of Retribution (Nightmare) C',
            'Law Of Retribution (Nightmare)',
          )
          .replace(
            'Sanctuary/Elite Sanctuary Onslaught (Sanctuary Onslaught)',
            'Elite Sanctuary Onslaught',
          )
          .replace(
            'Sanctuary/Sanctuary Onslaught (Sanctuary Onslaught)',
            'Sanctuary Onslaught',
          )
          .replace('/Lunaro Arena (Conclave)', '/Lunaro')
          .replace('/Lunaro Arena (Extra) (Conclave)', '/Lunaro')
          .replace(
            'Variant Cephalon Capture (Conclave)',
            'Variant Cephalon Capture',
          )
          .replace(
            'Variant Cephalon Capture (Extra) (Conclave)',
            'Variant Cephalon Capture',
          )
          .replace(
            'Variant Team Annihilation (Extra) (Conclave)',
            'Variant Team Annihilation',
          )
          .replace('Variant Annihilation (Extra)', 'Variant Annihilation')
          .replace(' (Conclave)', '')
          .replace('Rotation ', 'Rot ')
          .trim(),
        item: reward.item,
        rarity: reward.rarity,
        chance: Number.parseFloat(String(reward.chance)),
      }),
    );
  }

  /**
   * Group drops by location
   */
  private groupByLocation(data: Drop[]): GroupedDrops {
    const locBase: GroupedDrops = {};

    for (const reward of data) {
      if (!locBase[reward.place]) {
        locBase[reward.place] = {
          rewards: [],
        };
      }

      const slimmed = { ...reward };
      delete (slimmed as Partial<Drop>).place;
      locBase[reward.place].rewards.push(slimmed);
    }

    return locBase;
  }

  private async getLastUpdate(): Promise<number> {
    const lastUpdate = await this.cache.get<number>('last_updt');
    return lastUpdate ?? 0;
  }

  private async setLastUpdate(): Promise<void> {
    await this.cache.set('last_updt', this.lastUpdate);
  }
}
