import { Inject, Injectable } from '@nestjs/common';
import Items, { type Item, type ItemI18n } from '@wfcd/items';
import data from 'warframe-worldstate-data';
import { BaseCacheService } from './base-cache.service';
import type { FlatCacheStore } from './flat-cache-store';
import { type LoggerService, LogScope } from './logger.service';

const FOUR_HOURS = 14400000;
const i18nOnObject = true;
const caches = ['weapons', 'warframes', 'items', 'mods'] as const;

type CacheType = (typeof caches)[number];

/**
 * Ability with i18n data
 */
interface I18nAbility {
  uniqueName?: string;
  name?: string;
  description?: string;
  imageName?: string;
}

/**
 * Item with i18n data merged into the object.
 * After i18n processing, the i18n property is removed and locale-specific fields
 * (name, description, etc.) are merged directly into the item.
 */
type ProcessedItem = Omit<
  Item,
  'i18n' | 'name' | 'description' | 'abilities'
> & {
  name: string;
  description: string;
  abilities?: I18nAbility[];
  passiveDescription?: string;
  trigger?: string;
  systemName?: string;
};

interface ItemFilter {
  key: string;
  value: string;
}

interface ItemCache {
  weapons: ProcessedItem[];
  warframes: ProcessedItem[];
  items: ProcessedItem[];
  mods: ProcessedItem[];
}

interface GetOptions {
  by?: string;
  remove?: string[];
  only?: string[];
  term?: string;
  max?: number;
  filter?: ItemFilter[];
}

@Injectable()
export class ItemsCacheService extends BaseCacheService {
  protected ttl = FOUR_HOURS;
  protected logger: LoggerService;

  constructor(
    @Inject('CACHE_STORE_ITEMS') protected cacheStore: FlatCacheStore,
    @Inject('LOGGER_SERVICE') loggerService: LoggerService,
  ) {
    super();
    this.logger = loggerService;
    this.logger.setContext(LogScope.ITEMS);
    this.logger.setLevel('info');
  }

  async onModuleInit(): Promise<void> {
    this.lastUpdate = await this.getLastUpdate();
    await super.onModuleInit();
  }

  async populate(): Promise<void> {
    this.lastUpdate = await this.getLastUpdate();

    if (Date.now() - this.lastUpdate <= FOUR_HOURS) {
      this.logger.debug('No items update needed');
      return;
    }

    this.logger.info('Populating items cache...');

    for (const language of data.locales) {
      const cacheForLang = this.makeLanguageCache(language);

      for (const cacheType of caches) {
        await this.set(`${language}-${cacheType}`, cacheForLang[cacheType]);
      }
    }

    await this.setLastUpdate();
    this.save();
    this.logger.info('Items cache populated');
  }

  private makeLanguageCache(language: string): ItemCache {
    const base: Record<CacheType, Item[]> = {
      weapons: [
        ...new Items({
          category: ['Primary', 'Secondary', 'Melee', 'Arch-Melee', 'Arch-Gun'],
          i18n: true,
          i18nOnObject,
        }),
      ],
      warframes: [
        ...new Items({
          category: ['Warframes', 'Archwing'],
          i18n: true,
          i18nOnObject,
        }),
      ],
      items: [
        ...new Items({
          i18n: true,
          i18nOnObject,
        }),
      ],
      mods: [
        ...new Items({
          category: ['Mods'],
          i18n: true,
          i18nOnObject,
        }),
      ],
    };

    const merged: ItemCache = {
      weapons: [],
      warframes: [],
      items: [],
      mods: [],
    };

    for (const cacheType of caches) {
      const subCache = base[cacheType];
      merged[cacheType] = subCache.map((item): ProcessedItem => {
        // Remove i18n property from all items
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { i18n, ...itemWithoutI18n } = item as Item & {
          i18n?: Record<string, ItemI18n>;
        };

        // For English, items already have the correct name/description
        if (language === 'en') {
          return itemWithoutI18n as unknown as ProcessedItem;
        }

        // For non-English, check if we have i18n data
        if (!i18n) {
          // If no i18n data, fall back to English (which is already in the item)
          return itemWithoutI18n as unknown as ProcessedItem;
        }

        // Get the language-specific i18n data
        const langData = i18n[language];

        if (!langData) {
          // If no data for this language, fall back to English
          return itemWithoutI18n as unknown as ProcessedItem;
        }

        // Process abilities if present (only Warframes have abilities)
        let processedAbilities: I18nAbility[] | undefined;
        const itemWithAbilities = item as Item & { abilities?: I18nAbility[] };

        if (langData.abilities && Array.isArray(langData.abilities)) {
          processedAbilities = langData.abilities.map((ability, index) => {
            const originalAbility = itemWithAbilities.abilities?.[index];
            return {
              uniqueName: ability.uniqueName || originalAbility?.uniqueName,
              name: ability.name || originalAbility?.name,
              description: ability.description || originalAbility?.description,
              imageName: originalAbility?.imageName,
            };
          });
        }

        // Create the processed item by merging i18n data
        const processed: ProcessedItem = {
          ...(itemWithoutI18n as unknown as ProcessedItem),
          name: langData.name,
          description: langData.description,
          passiveDescription: langData.passiveDescription,
          trigger: langData.trigger,
          systemName: langData.systemName,
          abilities: processedAbilities,
        };

        return processed;
      });
    }

    return merged;
  }

  async getItems(
    key: CacheType,
    language: string,
    options: GetOptions = {},
  ): Promise<ProcessedItem[] | ProcessedItem | undefined> {
    const { by = 'name', remove, only, term, max, filter } = options;

    let base = await this.cacheStore.get<ProcessedItem[]>(`${language}-${key}`);

    if (!term && !(remove || only)) {
      return base;
    }

    if (!base) {
      this.logger.error('Items not hydrated. Forcing hydration.');
      await this.populate();
      base = await this.cacheStore.get<ProcessedItem[]>(`${language}-${key}`);
    }

    const bys = by.split('.');
    let filtered: ProcessedItem[] | ProcessedItem | undefined = base;

    if (filter) {
      filtered = this.filterArray(filtered as ProcessedItem[], filter);
    }

    if (term && max !== 1) {
      filtered = this.filterArray(base!, [{ key: by, value: term }]);
    }

    if (term && max === 1) {
      let keyDistance: number | undefined;
      let exact = false;
      filtered = undefined;

      base!
        .filter((item) => item && this.parseNestedKey(item, bys).length > 0)
        .forEach((item) => {
          const values = this.parseNestedKey(item, bys);

          if (
            values.find(
              (entry) =>
                String(entry).toLowerCase() === term.toString().toLowerCase(),
            )
          ) {
            filtered = item;
            exact = true;
          }

          if (!exact) {
            values.forEach((entry) => {
              if (
                String(entry)
                  .toLowerCase()
                  .includes(term.toString().toLowerCase())
              ) {
                const distance = String(entry)
                  .toLowerCase()
                  .replace(term.toString().toLowerCase(), '').length;

                if (!keyDistance || distance < keyDistance) {
                  keyDistance = distance;
                  filtered = item;
                }
              }
            });
          }
        });
    }

    return this.cleanup(filtered, { remove, only });
  }

  private cleanup(
    result: ProcessedItem | ProcessedItem[] | undefined,
    { only, remove }: { only?: string[]; remove?: string[] },
  ): ProcessedItem | ProcessedItem[] | undefined {
    if (!result) return undefined;
    if (!(only || remove)) return result;

    if (Array.isArray(result)) {
      return result.map(
        (subr) => this.cleanup(subr, { only, remove }) as ProcessedItem,
      );
    }

    const clone = { ...result };

    if (Array.isArray(only) && only.length) {
      Object.keys(clone).forEach((field) => {
        if (!only.includes(field)) {
          delete clone[field as keyof ProcessedItem];
        }
      });
    } else if (Array.isArray(remove) && remove.length) {
      remove.forEach((field) => {
        delete clone[field as keyof ProcessedItem];
      });
    }

    return clone;
  }

  private filterArray(
    array: ProcessedItem[],
    filters: ItemFilter[],
  ): ProcessedItem[] {
    let filtered = array;

    filters.forEach(({ key, value }) => {
      const bys = key.split('.');
      filtered = filtered
        .filter((item) => key && this.parseNestedKey(item, bys).length > 0)
        .filter((item) => {
          const values = this.parseNestedKey(item, bys);
          if (!(item && values)) return false;

          return values.find((entry) =>
            String(entry)
              .toLowerCase()
              .includes(value.toString().toLowerCase()),
          );
        });
    });

    return filtered;
  }

  private parseNestedKey(item: ProcessedItem, by: string[]): unknown[] {
    let resultList: unknown[] = [];

    by.reduce<unknown>((prevNode, currentValue, index) => {
      if (!prevNode) {
        return undefined;
      }

      // Type guard for object with indexable keys
      if (typeof prevNode !== 'object' || prevNode === null) {
        return undefined;
      }

      const nodeObj = prevNode as Record<string, unknown>;

      if (!nodeObj[currentValue]) {
        if (Array.isArray(prevNode)) {
          resultList = (prevNode as ProcessedItem[])
            .map((element) => this.parseNestedKey(element, by.slice(index)))
            .flat(Infinity)
            .filter(
              (element): element is unknown =>
                element !== undefined && element !== null,
            );
        }
      } else if (
        typeof nodeObj[currentValue] === 'object' &&
        nodeObj[currentValue] !== null
      ) {
        return nodeObj[currentValue];
      } else {
        resultList.push(nodeObj[currentValue]);
      }

      return nodeObj[currentValue];
    }, item);

    return resultList;
  }
}
