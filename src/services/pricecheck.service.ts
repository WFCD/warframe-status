import { PRICECHECKS_ENABLED } from '@nest/config/integrations';
import { Inject, Injectable } from '@nestjs/common';
import Nexus, {
  type Platform,
  type PriceCheckOptions,
} from 'warframe-nexus-query';
import type { LoggerService } from './logger.service';

const MAX_USER_AGENT_QUERIERS = 8;

/**
 * Service for price checking using warframe-nexus-query
 */
@Injectable()
export class PriceCheckService {
  private readonly queriers = new Map<string, Nexus>();
  private readonly priceChecksEnabled: boolean;

  constructor(
    @Inject('LOGGER_SERVICE')
    private readonly logger: LoggerService,
  ) {
    this.priceChecksEnabled = PRICECHECKS_ENABLED;
    this.querierFor();
  }

  /**
   * Querier whose market User-Agent matches `userAgent`.
   * warframe-nexus-query reads `MARKET_USER_AGENT` only while constructing Settings.
   */
  querierFor(userAgent?: string): Nexus {
    const key = userAgent ?? '';
    const cached = this.queriers.get(key);
    if (cached) {
      this.queriers.delete(key);
      this.queriers.set(key, cached);
      return cached;
    }

    const created = this.createQuerier(userAgent);
    this.queriers.set(key, created);
    this.evictQueriers();
    return created;
  }

  private createQuerier(userAgent?: string): Nexus {
    if (!userAgent) {
      return new Nexus({ logger: this.logger });
    }

    const previous = process.env.MARKET_USER_AGENT;
    process.env.MARKET_USER_AGENT = userAgent;
    try {
      return new Nexus({ logger: this.logger });
    } finally {
      if (previous === undefined) delete process.env.MARKET_USER_AGENT;
      else process.env.MARKET_USER_AGENT = previous;
    }
  }

  private evictQueriers(): void {
    if (this.queriers.size <= MAX_USER_AGENT_QUERIERS) return;

    for (const key of this.queriers.keys()) {
      if (this.queriers.size <= MAX_USER_AGENT_QUERIERS) break;
      if (key === '') continue;
      const evicted = this.queriers.get(key);
      this.queriers.delete(key);
      void evicted?.stopUpdating();
    }
  }

  /**
   * Check if price checks are enabled
   */
  isEnabled(): boolean {
    return this.priceChecksEnabled;
  }

  /**
   * Price check by query string
   */
  async priceCheckQueryString(
    query: string,
    platform?: Platform,
    options: PriceCheckOptions = {},
    userAgent?: string,
  ): Promise<string> {
    return this.querierFor(userAgent).priceCheckQueryString(
      query,
      undefined,
      platform,
      options,
    );
  }

  /**
   * Price check by query (raw search)
   */
  async priceCheckQuery(
    query: string,
    platform?: Platform,
    options: PriceCheckOptions = {},
    userAgent?: string,
  ): Promise<unknown[]> {
    return this.querierFor(userAgent).priceCheckQuery(query, platform, options);
  }

  /**
   * Price check with attachment format
   */
  async priceCheckQueryAttachment(
    query: string,
    platform?: Platform,
    options: PriceCheckOptions = {},
    userAgent?: string,
  ): Promise<unknown[]> {
    return this.querierFor(userAgent).priceCheckQueryAttachment(
      query,
      undefined,
      platform,
      options,
    );
  }
}
