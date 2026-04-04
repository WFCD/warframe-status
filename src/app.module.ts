import { DataController } from '@controllers/data.controller';
import { DropsController } from '@controllers/drops.controller';
import { HeartbeatController } from '@controllers/heartbeat.controller';
import { ItemsController } from '@controllers/items.controller';
import { PriceCheckController } from '@controllers/pricecheck.controller';
import { ProfileController } from '@controllers/profile.controller';
import { RivensController } from '@controllers/rivens.controller';
import { RssController } from '@controllers/rss.controller';
import { TwitterController } from '@controllers/twitter.controller';
import { WFInfoController } from '@controllers/wfinfo.controller';
import { WorldstateController } from '@controllers/worldstate.controller';
import { CacheModule } from '@modules/cache.module';
import { LoggerModule } from '@modules/logger.module';
import { StatusGateway } from '@nest/gateways/status.gateway';
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { DropsCacheService } from '@services/drops-cache.service';
import { HydrationService } from '@services/hydration.service';
import { ItemsCacheService } from '@services/items-cache.service';
import { LoggerService } from '@services/logger.service';
import { PriceCheckService } from '@services/pricecheck.service';
import { ProfileService } from '@services/profile.service';
import { RivensCacheService } from '@services/rivens-cache.service';
import { TwitchCacheService } from '@services/twitch-cache.service';
import { WarframeDataService } from '@services/warframe-data.service';
import { WFInfoCacheService } from '@services/wfinfo-cache.service';
import { WorldStateService } from '@services/worldstate.service';

// Feature flags - default to enabled for passive configuration
// Users can explicitly disable by setting USE_WORLDSTATE=false or removing SOCKET from FEATURES
const USE_WORLDSTATE = process.env.USE_WORLDSTATE !== 'false'; // Enabled by default
const FEATURES = process.env.FEATURES?.split(',') || ['SOCKET']; // SOCKET enabled by default
const USE_SOCKET = FEATURES.includes('SOCKET');

// Base controllers (always enabled)
const baseControllers = [
  HeartbeatController,
  ItemsController,
  DropsController,
  RivensController,
  WFInfoController,
  PriceCheckController,
  ProfileController,
  TwitterController, // Always loaded, but returns 404 when TWITTER_ACTIVE is not set
  DataController, // Always loaded for static data endpoints (synthTargets, arcanes, etc.)
];

// Conditional controllers based on feature flags
const conditionalControllers = [
  ...(USE_WORLDSTATE ? [WorldstateController, RssController] : []),
];

// Base providers (always enabled)
const baseProviders = [
  {
    provide: 'LOGGER_SERVICE',
    useClass: LoggerService,
  },
  {
    provide: 'WarframeDataService',
    useClass: WarframeDataService,
  },
  {
    provide: 'PRICECHECK_SERVICE',
    useClass: PriceCheckService,
  },
  {
    provide: 'PROFILE_SERVICE',
    useClass: ProfileService,
  },
  {
    provide: 'ITEMS_CACHE_SERVICE',
    useClass: ItemsCacheService,
  },
  {
    provide: 'DROPS_CACHE_SERVICE',
    useClass: DropsCacheService,
  },
  {
    provide: 'RIVENS_CACHE_SERVICE',
    useClass: RivensCacheService,
  },
  {
    provide: 'WFINFO_CACHE_SERVICE',
    useClass: WFInfoCacheService,
  },
  {
    provide: 'TWITCH_CACHE_SERVICE',
    useClass: TwitchCacheService,
  },
  HydrationService,
];

// Conditional providers based on feature flags
const conditionalProviders = [
  ...(USE_WORLDSTATE
    ? [
        {
          provide: 'WORLDSTATE_SERVICE',
          useClass: WorldStateService,
        },
      ]
    : []),
  ...(USE_SOCKET ? [StatusGateway] : []),
];

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env.local', '.env'], // Load .env.local first (higher precedence)
      ignoreEnvFile: false,
      expandVariables: true, // Support variable expansion like ${VAR}
    }),
    ScheduleModule.forRoot(),
    LoggerModule,
    CacheModule.register({
      stores: [
        {
          name: 'items',
          config: {
            cacheId: '.items',
            ttl: 14400000, // 4 hours
          },
        },
        {
          name: 'drops',
          config: {
            cacheId: '.drops',
            ttl: 14400000, // 4 hours
          },
        },
        {
          name: 'rivens',
          config: {
            cacheId: '.rivens',
            ttl: 14400000, // 4 hours
          },
        },
        {
          name: 'wfinfo',
          config: {
            cacheId: '.wfinfo',
            ttl: 3600000, // 1 hour
          },
        },
        {
          name: 'twitch',
          config: {
            cacheId: '.twitch',
            ttl: 172800000, // 2 days
          },
        },
      ],
    }),
  ],
  controllers: [...baseControllers, ...conditionalControllers],
  providers: [...baseProviders, ...conditionalProviders],
})
export class AppModule {}
