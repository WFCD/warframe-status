import { Injectable, type OnModuleInit } from '@nestjs/common';
import type { FlatCacheStore } from './flat-cache-store';
import type { LoggerService } from './logger.service';

/**
 * Base cache service class for all cache implementations
 * Provides common functionality for TTL checking, population, and cache management
 */
@Injectable()
export abstract class BaseCacheService implements OnModuleInit {
  protected abstract cacheStore: FlatCacheStore;
  protected abstract logger: LoggerService;
  protected abstract ttl: number;
  protected lastUpdate = 0;

  async onModuleInit(): Promise<void> {
    // Check if BUILD mode is enabled for initial population
    if (process.env.BUILD?.trim().startsWith('build')) {
      await this.populate();
    }
  }

  /**
   * Abstract method to populate cache data
   * Must be implemented by child classes
   */
  protected abstract populate(): Promise<void>;

  /**
   * Check if cache needs update based on TTL
   */
  protected needsUpdate(): boolean {
    const elapsed = Date.now() - this.lastUpdate;
    return elapsed > this.ttl;
  }

  /**
   * Get last update timestamp
   */
  protected async getLastUpdate(): Promise<number> {
    const lastUpdt = await this.cacheStore.get<number>('last_updt');
    return lastUpdt || 0;
  }

  /**
   * Set last update timestamp
   */
  protected async setLastUpdate(timestamp?: number): Promise<void> {
    this.lastUpdate = timestamp || Date.now();
    await this.cacheStore.set('last_updt', this.lastUpdate);
  }

  /**
   * Save cache to disk
   */
  protected save(): void {
    this.cacheStore.save(true);
  }

  /**
   * Get value from cache
   */
  protected async get<T>(key: string): Promise<T | undefined> {
    return this.cacheStore.get<T>(key);
  }

  /**
   * Set value in cache
   */
  protected async set<T>(key: string, value: T): Promise<void> {
    await this.cacheStore.set(key, value);
  }

  /**
   * Get all keys from cache
   */
  protected async getKeys(pattern?: string): Promise<string[]> {
    return this.cacheStore.keys(pattern);
  }

  /**
   * Delete key from cache
   */
  protected async delete(key: string): Promise<void> {
    await this.cacheStore.del(key);
  }
}
