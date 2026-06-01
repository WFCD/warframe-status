import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { FlatCacheStore } from '@services/flat-cache-store';
import { expect } from 'chai';

describe('FlatCacheStore', () => {
  let cacheDir: string;
  let store: FlatCacheStore;

  beforeEach(() => {
    cacheDir = mkdtempSync(join(tmpdir(), 'flat-cache-store-'));
    store = new FlatCacheStore({
      cacheId: 'test-cache',
      cacheDir,
      ttl: 1000,
    });
  });

  afterEach(() => {
    rmSync(cacheDir, { recursive: true, force: true });
  });

  it('should store and retrieve values', async () => {
    await store.set('hello', { value: 42 });
    const result = await store.get<{ value: number }>('hello');
    expect(result).to.deep.equal({ value: 42 });
  });

  it('should delete values', async () => {
    await store.set('temp', 'data');
    await store.del('temp');
    const result = await store.get('temp');
    expect(result).to.equal(undefined);
  });

  it('should support multi-get and multi-set', async () => {
    await store.mset([
      ['a', 1],
      ['b', 2],
    ]);

    const values = await store.mget('a', 'b', 'missing');
    expect(values).to.deep.equal([1, 2, undefined]);
  });

  it('should list keys and match patterns', async () => {
    await store.set('alpha', 1);
    await store.set('beta', 2);

    const keys = await store.keys('a*');
    expect(keys).to.include('alpha');
    expect(keys).to.not.include('beta');
  });

  it('should report ttl for expiring entries', async () => {
    await store.set('expires', 'soon', 5000);
    const ttl = await store.ttl('expires');
    expect(ttl).to.be.greaterThan(0);
  });

  it('should expire values after ttl', async () => {
    await store.set('short-lived', 'value', 10);
    await new Promise((resolve) => setTimeout(resolve, 20));
    const result = await store.get('short-lived');
    expect(result).to.equal(undefined);
  });
});
