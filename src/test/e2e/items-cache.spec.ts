import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { FlatCacheStore } from '@services/flat-cache-store';
import { ItemsCacheService } from '@services/items-cache.service';
import { LoggerService, LogScope } from '@services/logger.service';
import { expect } from 'chai';

describe('ItemsCacheService', () => {
  let cacheDir: string;
  let cacheStore: FlatCacheStore;
  let service: ItemsCacheService;
  let populateCalls = 0;
  let lastPopulateForce: boolean | undefined;

  beforeEach(() => {
    cacheDir = mkdtempSync(join(tmpdir(), 'items-cache-'));
    cacheStore = new FlatCacheStore({
      cacheId: 'test-items',
      cacheDir,
    });

    const logger = new LoggerService();
    logger.setContext(LogScope.ITEMS);
    logger.setLevel('error');

    service = new ItemsCacheService(cacheStore, logger);
    populateCalls = 0;
    lastPopulateForce = undefined;

    const originalPopulate = service.populate.bind(service);
    service.populate = async (options?: { force?: boolean }) => {
      populateCalls += 1;
      lastPopulateForce = options?.force;
      return originalPopulate(options);
    };
  });

  afterEach(() => {
    rmSync(cacheDir, { recursive: true, force: true });
  });

  it('should force hydration when cache keys are missing despite a fresh last_updt', async () => {
    await cacheStore.set('last_updt', Date.now());

    const result = await service.getItems('weapons', 'en', {
      term: 'Braton',
      max: 1,
    });

    expect(populateCalls).to.equal(1);
    expect(lastPopulateForce).to.equal(true);
    expect(result).to.exist;
  });

  it('should return undefined instead of throwing when hydration leaves cache empty', async () => {
    service.populate = async () => {
      populateCalls += 1;
    };

    const result = await service.getItems('weapons', 'en', {
      term: 'Braton',
      max: 1,
    });

    expect(populateCalls).to.equal(1);
    expect(result).to.equal(undefined);
  });
});
