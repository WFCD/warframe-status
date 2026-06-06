import { Inject, Injectable } from '@nestjs/common';
import type { Cache } from 'cache-manager';
import { type LoggerService, LogScope } from './logger.service';

const TWO_DAYS = 172800000;

// Twitch API constants
const CLIENT_ID = 'kimne78kx3ncx6brgo4mv6wki5h1ko'; // twitch's client id
const WF_ARSENAL_ID = 'ud1zj704c0eb1s553jbkayvqxjft97';
const TWITCH_CHANNEL_ID = '89104719'; // tobitenno

/**
 * TwitchCacheService manages Twitch extension token
 * Matches Express behavior from src/lib/caches/Twitch.js
 *
 * Fetches JWT token for Warframe Arsenal extension
 */
@Injectable()
export class TwitchCacheService {
  private logger: LoggerService;
  private lastUpdate = 0;

  constructor(
    @Inject('LOGGER_SERVICE') loggerService: LoggerService,
    @Inject('CACHE_STORE_TWITCH') private readonly cache: Cache,
  ) {
    this.logger = loggerService;
    this.logger.setContext(LogScope.TWITCH);
    this.logger.setLevel('info');
  }

  async onModuleInit(): Promise<void> {
    this.lastUpdate = await this.getLastUpdate();
  }

  /**
   * Populate the Twitch cache with extension token
   * Includes TTL checking - skips if updated within 2 days
   */
  public async populate(): Promise<void> {
    this.lastUpdate = await this.getLastUpdate();
    const token = await this.cache.get<string>('token');

    if (
      CLIENT_ID &&
      Date.now() - this.lastUpdate >= TWO_DAYS &&
      token !== 'unset'
    ) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 30000);
        const response = await fetch('https://gql.twitch.tv/gql', {
          method: 'POST',
          headers: {
            'client-id': CLIENT_ID,
          },
          body: `[{"operationName":"ExtensionsForChannel","variables":{"channelID":"${TWITCH_CHANNEL_ID}"},"extensions":{"persistedQuery":{"version":1,"sha256Hash":"d52085e5b03d1fc3534aa49de8f5128b2ee0f4e700f79bf3875dcb1c90947ac3"}}}]`,
          signal: controller.signal,
        });
        clearTimeout(timeoutId);

        interface TwitchResponse {
          data?: {
            user?: {
              channel?: {
                selfInstalledExtensions?: Array<{
                  token?: {
                    extensionID?: string;
                    jwt?: string;
                  };
                }>;
              };
            };
          };
        }

        const data = (await response.json()) as TwitchResponse[];

        let jwt = data?.[0]?.data?.user?.channel?.selfInstalledExtensions?.find(
          (s) => s?.token?.extensionID === WF_ARSENAL_ID,
        )?.token?.jwt;

        jwt = jwt || 'unset';

        await this.cache.set('token', jwt);

        this.lastUpdate = Date.now();
        await this.setLastUpdate();
      } catch (error) {
        const err = error as Error;
        this.logger.error('Cannot hydrate Twitch token', err.stack);
      }
    }
  }

  /**
   * Get the Twitch extension JWT token
   */
  async getToken(): Promise<string | undefined> {
    const token = await this.cache.get<string>('token');
    return token ?? undefined;
  }

  private async getLastUpdate(): Promise<number> {
    const lastUpdate = await this.cache.get<number>('last_updt');
    return lastUpdate ?? 0;
  }

  private async setLastUpdate(): Promise<void> {
    await this.cache.set('last_updt', this.lastUpdate);
  }
}
