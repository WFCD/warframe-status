import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { create } from 'flat-cache';

interface Cache {
  load(cacheId: string, cacheDir?: string): void;
  loadFile(pathToFile: string): void;
  all(): { [key: string]: any };
  keys(): string[];
  setKey(key: string, value: any): void;
  removeKey(key: string): void;
  getKey(key: string): any;
  save(noPrune?: boolean): void;
  removeCacheFile(): boolean;
  destroy(): void;
}

export interface FlatCacheStoreConfig {
  cacheId: string;
  cacheDir?: string;
  ttl?: number;
}

export interface CacheStore {
  get<T>(key: string): Promise<T | undefined>;
  set<T>(key: string, value: T, ttl?: number): Promise<void>;
  del(key: string): Promise<void>;
  reset(): Promise<void>;
  mget(...keys: string[]): Promise<unknown[]>;
  mset(args: [string, unknown][], ttl?: number): Promise<void>;
  mdel(...keys: string[]): Promise<void>;
  keys(pattern?: string): Promise<string[]>;
  ttl(key: string): Promise<number>;
}

interface CachedValue<T> {
  value: T;
  expires?: number;
}

/**
 * Custom flat-cache Store implementation for NestJS cache-manager
 * Provides file-based caching with TTL support
 */
export class FlatCacheStore implements CacheStore {
  private cache: Cache;
  private defaultTtl: number;

  constructor(config: FlatCacheStoreConfig) {
    const dirName = dirname(fileURLToPath(import.meta.url));
    const cacheDir = config.cacheDir || resolve(dirName, '../../../caches');

    this.cache = create({
      cacheId: config.cacheId,
      cacheDir,
    });

    this.defaultTtl = config.ttl || 0; // 0 means no expiration
  }

  async get<T>(key: string): Promise<T | undefined> {
    const cached = this.cache.getKey(key) as CachedValue<T> | undefined;

    if (!cached) {
      return undefined;
    }

    // Check if expired
    if (cached.expires && cached.expires < Date.now()) {
      await this.del(key);
      return undefined;
    }

    return cached.value;
  }

  async set<T>(key: string, value: T, ttl?: number): Promise<void> {
    const expiresIn = ttl !== undefined ? ttl : this.defaultTtl;
    const expires = expiresIn > 0 ? Date.now() + expiresIn : undefined;

    const cached: CachedValue<T> = {
      value,
      expires,
    };

    this.cache.setKey(key, cached);
    this.cache.save(true);
  }

  async del(key: string): Promise<void> {
    this.cache.removeKey(key);
    this.cache.save(true);
  }

  async reset(): Promise<void> {
    this.cache.destroy();
  }

  async mget(...keys: string[]): Promise<unknown[]> {
    return Promise.all(keys.map((key) => this.get(key)));
  }

  async mset(args: [string, unknown][], ttl?: number): Promise<void> {
    for (const [key, value] of args) {
      await this.set(key, value, ttl);
    }
  }

  async mdel(...keys: string[]): Promise<void> {
    for (const key of keys) {
      await this.del(key);
    }
  }

  async keys(pattern?: string): Promise<string[]> {
    const allKeys = this.cache.keys();

    if (!pattern) {
      return allKeys;
    }

    // Simple pattern matching (supports * wildcard)
    const regex = new RegExp('^' + pattern.replace(/\*/g, '.*') + '$');
    return allKeys.filter((key) => regex.test(key));
  }

  async ttl(key: string): Promise<number> {
    const cached = this.cache.getKey(key) as CachedValue<unknown> | undefined;

    if (!cached || !cached.expires) {
      return -1; // No expiration set
    }

    const remaining = cached.expires - Date.now();
    return remaining > 0 ? remaining : -2; // -2 means expired
  }

  /**
   * Direct access to flat-cache instance for advanced operations
   */
  getRawCache(): Cache {
    return this.cache;
  }

  /**
   * Save cache to disk
   */
  save(noPrune = true): void {
    this.cache.save(noPrune);
  }
}

/**
 * Factory function to create FlatCacheStore instances
 */
export function createFlatCacheStore(
  config: FlatCacheStoreConfig,
): FlatCacheStore {
  return new FlatCacheStore(config);
}
