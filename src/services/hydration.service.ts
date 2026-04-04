import cluster from 'node:cluster';
import {
  Inject,
  Injectable,
  type OnApplicationBootstrap,
  type OnModuleInit,
} from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import type { DropsCacheService } from './drops-cache.service';
import type { ItemsCacheService } from './items-cache.service';
import { type LoggerService, LogScope } from './logger.service';
import type { RivensCacheService } from './rivens-cache.service';
import type { TwitchCacheService } from './twitch-cache.service';
import type { WFInfoCacheService } from './wfinfo-cache.service';

/**
 * HydrationService manages scheduled cache population
 * Ensures only the primary process (in cluster mode) performs hydration
 * Matches Express behavior from src/lib/hydrate.js
 */
@Injectable()
export class HydrationService implements OnModuleInit, OnApplicationBootstrap {
  private logger: LoggerService;
  private isBootstrapHydrationComplete = false;

  constructor(
    @Inject('LOGGER_SERVICE') loggerService: LoggerService,
    @Inject('ITEMS_CACHE_SERVICE')
    private readonly itemsCache: ItemsCacheService,
    @Inject('DROPS_CACHE_SERVICE')
    private readonly dropsCache: DropsCacheService,
    @Inject('RIVENS_CACHE_SERVICE')
    private readonly rivensCache: RivensCacheService,
    @Inject('WFINFO_CACHE_SERVICE')
    private readonly wfinfoCache: WFInfoCacheService,
    @Inject('TWITCH_CACHE_SERVICE')
    private readonly twitchCache: TwitchCacheService,
  ) {
    this.logger = loggerService;
    this.logger.setContext(LogScope.HYDRATE);
    this.logger.setLevel('info');
  }

  /**
   * Phase 1: Module initialization
   * If BUILD=build, force immediate hydration (blocks startup)
   * Only runs in primary process (or non-cluster mode)
   */
  async onModuleInit(): Promise<void> {
    const forceBuild = process.env.BUILD === 'build';
    const useCluster = process.env.USE_CLUSTER === 'true';
    const isPrimary = !useCluster || cluster.isPrimary;

    if (forceBuild && isPrimary) {
      this.logger.info(
        'Primary: Forced cache hydration (BUILD=build) starting...',
      );
      const start = Date.now();
      await this.hydrateAll();
      const duration = Date.now() - start;
      this.isBootstrapHydrationComplete = true;
      this.logger.info(`Primary: Forced hydration complete in ${duration}ms`);

      // Signal workers that cache is ready
      if (useCluster && cluster.isPrimary) {
        this.signalWorkersReady();
      }
    } else if (forceBuild && !isPrimary) {
      this.logger.info(
        'Worker: Waiting for primary to complete cache hydration...',
      );
      await this.waitForCacheReady();
      this.isBootstrapHydrationComplete = true;
      this.logger.info('Worker: Cache ready, proceeding with startup');
    }
  }

  /**
   * Phase 2: Application bootstrap
   * If not force-built, do lazy background hydration
   * Only runs in primary process (or non-cluster mode)
   */
  async onApplicationBootstrap(): Promise<void> {
    const useCluster = process.env.USE_CLUSTER === 'true';
    const isPrimary = !useCluster || cluster.isPrimary;

    if (!this.isBootstrapHydrationComplete && isPrimary) {
      this.logger.info('Primary: Starting background cache hydration...');

      // Don't await - run in background
      this.hydrateAll()
        .then(() => {
          this.logger.info('Primary: Background hydration complete');
          if (useCluster && cluster.isPrimary) {
            this.signalWorkersReady();
          }
        })
        .catch((error: Error) => {
          this.logger.error(
            'Primary: Background hydration failed',
            error.stack,
          );
        });
    }
  }

  /**
   * Scheduled hourly hydration (matches Express cron: '0 0 * * * *')
   * Runs at the start of every hour
   * Only runs in primary process
   */
  @Cron('0 0 * * * *', {
    name: 'cache-hydration',
    timeZone: 'UTC',
  })
  async scheduledHydration(): Promise<void> {
    const useCluster = process.env.USE_CLUSTER === 'true';
    const isPrimary = !useCluster || cluster.isPrimary;

    if (!isPrimary) {
      this.logger.debug(
        'Worker: Skipping scheduled hydration (runs on primary only)',
      );
      return;
    }

    this.logger.info('Primary: Scheduled cache hydration started');
    await this.hydrateAll();
  }

  /**
   * Main hydration function
   * Calls populate() on each cache service
   * Each service manages its own TTL internally
   */
  private async hydrateAll(): Promise<void> {
    const start = Date.now();

    try {
      // Sequential population (same as Express)
      // Each service checks TTL and skips if not needed
      await this.itemsCache.populate();
      await this.dropsCache.populate();
      await this.rivensCache.populate();
      await this.wfinfoCache.populate();
      await this.twitchCache.populate();

      const duration = Date.now() - start;
      this.logger.info(`Cache hydration complete in ${duration}ms`);
    } catch (error) {
      const err = error as Error;
      this.logger.error('Cache hydration failed', err.stack);
      throw error;
    }
  }

  /**
   * Signal workers that cache is ready via IPC
   */
  private signalWorkersReady(): void {
    if (!cluster.isPrimary) return;

    for (const id in cluster.workers) {
      cluster.workers[id]?.send({ cmd: 'cache-ready' });
    }

    this.logger.debug('Primary: Signaled workers that cache is ready');
  }

  /**
   * Wait for cache-ready signal from primary process
   */
  private async waitForCacheReady(): Promise<void> {
    return new Promise<void>((resolve) => {
      const messageHandler = (msg: { cmd?: string }) => {
        if (msg.cmd === 'cache-ready') {
          process.off('message', messageHandler);
          resolve();
        }
      };

      process.on('message', messageHandler);

      // Timeout after 5 minutes
      setTimeout(() => {
        process.off('message', messageHandler);
        this.logger.warn('Worker: Cache ready timeout, proceeding anyway');
        resolve();
      }, 300000);
    });
  }
}
