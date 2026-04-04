import { Inject, Injectable } from '@nestjs/common';
import Nexus, { type Platform } from 'warframe-nexus-query';
import type { LoggerService } from './logger.service';

/**
 * Service for price checking using warframe-nexus-query
 */
@Injectable()
export class PriceCheckService {
  private readonly nexusQuerier: Nexus;
  private readonly priceChecksEnabled: boolean;

  constructor(
    @Inject('LOGGER_SERVICE')
    private readonly logger: LoggerService,
  ) {
    // Initialize Nexus query with logger
    this.nexusQuerier = new Nexus({
      logger: this.logger,
    });

    // Check if price checks are enabled from environment
    this.priceChecksEnabled = process.env.PRICECHECKS_ENABLED !== 'false';
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
  ): Promise<string> {
    return this.nexusQuerier.priceCheckQueryString(query, undefined, platform);
  }

  /**
   * Price check by query (raw search)
   */
  async priceCheckQuery(
    query: string,
    platform?: Platform,
  ): Promise<unknown[]> {
    return this.nexusQuerier.priceCheckQuery(query, platform);
  }

  /**
   * Price check with attachment format
   */
  async priceCheckQueryAttachment(
    query: string,
    platform?: Platform,
  ): Promise<unknown[]> {
    return this.nexusQuerier.priceCheckQueryAttachment(
      query,
      undefined,
      platform,
    );
  }
}
