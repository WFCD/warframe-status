import { type DynamicModule, Global, Module } from '@nestjs/common';
import {
  FlatCacheStore,
  type FlatCacheStoreConfig,
} from '@services/flat-cache-store';

export interface CacheModuleOptions {
  stores: {
    name: string;
    config: FlatCacheStoreConfig;
  }[];
}

@Global()
@Module({})
export class CacheModule {
  static register(options: CacheModuleOptions): DynamicModule {
    const providers = options.stores.map((storeConfig) => ({
      provide: `CACHE_STORE_${storeConfig.name.toUpperCase()}`,
      useFactory: () => {
        return new FlatCacheStore(storeConfig.config);
      },
    }));

    return {
      module: CacheModule,
      providers,
      exports: providers.map((p) => p.provide),
    };
  }
}
