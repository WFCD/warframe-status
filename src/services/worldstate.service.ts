import {
  Inject,
  Injectable,
  InternalServerErrorException,
  type OnModuleInit,
} from '@nestjs/common';
import WorldStateEmitter from 'worldstate-emitter';
import { type LoggerService, LogScope } from './logger.service';

/**
 * WorldStateService wraps the worldstate-emitter library
 * Provides access to live Warframe worldstate data
 */
@Injectable()
export class WorldStateService implements OnModuleInit {
  private logger: LoggerService;
  private emitter?: WorldStateEmitter;

  constructor(@Inject('LOGGER_SERVICE') loggerService: LoggerService) {
    this.logger = loggerService;
    this.logger.setContext(LogScope.WORLDSTATE);
    this.logger.setLevel('info');
  }

  async onModuleInit(): Promise<void> {
    this.logger.info('Initializing WorldState emitter...');
    try {
      this.emitter = await WorldStateEmitter.make({
        features: ['worldstate', 'rss', 'twitter'],
      });
      this.logger.info(
        'WorldState emitter created, waiting for initial data...',
      );

      // Wait for the first worldstate data to be available
      const initTimeout = parseInt(
        process.env.WORLDSTATE_INIT_TIMEOUT || '60000',
        10,
      );
      await new Promise<void>((resolve, reject) => {
        const timeout = setTimeout(() => {
          reject(
            new Error(
              `Timeout waiting for initial worldstate data :: ${process.env.WORLDSTATE_INIT_TIMEOUT || '60000'}ms`,
            ),
          );
        }, initTimeout);

        // Set up event listener before checking if data already exists
        const handler = () => {
          clearTimeout(timeout);
          this.logger.info('Initial worldstate data received');
          this.emitter!.removeListener('ws:update:parsed', handler);
          resolve();
        };

        this.emitter!.on('ws:update:parsed', handler);

        // Check if data is already available (race condition handling)
        if (this.emitter!.getWorldstate('en')) {
          clearTimeout(timeout);
          this.logger.info('Worldstate data already available');
          this.emitter!.removeListener('ws:update:parsed', handler);
          resolve();
        }
      });

      this.logger.info('WorldState emitter initialized successfully');
    } catch (error) {
      const err = error as Error;
      this.logger.error('Failed to initialize WorldState emitter', err.stack);
      throw error;
    }
  }

  /**
   * Get worldstate data for a specific language
   * @param language - Language code (e.g., 'en', 'es', 'fr')
   * @returns Worldstate data object
   */
  getWorldstate(language: string): unknown {
    if (!this.emitter) {
      throw new InternalServerErrorException(
        'WorldState emitter not initialized',
      );
    }

    try {
      return this.emitter.getWorldstate(language);
    } catch (error) {
      const err = error as Error;
      this.logger.debug(
        `Error getting worldstate for language ${language}: ${err.message}`,
      );
      return undefined;
    }
  }

  /**
   * Get Twitter feed data
   * @returns Twitter feed array
   */
  async getTwitter(): Promise<unknown> {
    if (!this.emitter) {
      throw new InternalServerErrorException(
        'WorldState emitter not initialized',
      );
    }

    try {
      return await this.emitter.getTwitter();
    } catch (error) {
      const err = error as Error;
      this.logger.error('Error getting Twitter data', err.stack);
      throw error;
    }
  }

  /**
   * Get RSS feed data
   * @returns RSS feed data
   */
  getRss(): unknown {
    if (!this.emitter) {
      throw new InternalServerErrorException(
        'WorldState emitter not initialized',
      );
    }

    try {
      return this.emitter.getRss();
    } catch (error) {
      const err = error as Error;
      this.logger.error('Error getting RSS data', err.stack);
      throw error;
    }
  }

  /**
   * Get the underlying WorldState emitter for event subscription
   * @returns WorldStateEmitter instance or undefined if not initialized
   */
  getEmitter(): WorldStateEmitter | undefined {
    return this.emitter;
  }
}
