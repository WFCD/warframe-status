import { WORLDSTATE_INIT_TIMEOUT } from '@nest/config/env';
import {
  Inject,
  Injectable,
  InternalServerErrorException,
  type OnModuleInit,
} from '@nestjs/common';
// biome-ignore lint/style/useImportType: nest requires this import to resolve the injectable
import { EventEmitter2 } from '@nestjs/event-emitter';
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

  constructor(
    @Inject('LOGGER_SERVICE') loggerService: LoggerService,
    @Inject(EventEmitter2) private readonly eventEmitter: EventEmitter2,
  ) {
    this.logger = loggerService;
    this.logger.setContext(LogScope.WORLDSTATE);
  }

  async onModuleInit(): Promise<void> {
    void this.init();
  }

  private async init(): Promise<void> {
    this.logger.info('Initializing WorldState emitter...');
    try {
      this.emitter = await WorldStateEmitter.make({
        logger: this.logger.getWinston(),
      });
      this.logger.info(
        'WorldState emitter created, waiting for initial data...',
      );

      // Wait for the first worldstate data to be available
      const initTimeout = WORLDSTATE_INIT_TIMEOUT;
      await new Promise<void>((resolve, reject) => {
        const interval = setInterval(() => {
          this.logger.warn('Still waiting for initial data...');
        }, initTimeout);

        // Set up event listener before checking if data already exists
        const handler = () => {
          this.logger.info('Initial WorldState data received');
          try {
            clearInterval(interval);
            this.emitter!.removeListener('ws:update:parsed', handler);
            resolve();
          } catch (error) {
            reject(error);
          }
        };

        this.emitter!.on('ws:update:parsed', handler);

        // Check if data is already available (race condition handling)
        if (this.emitter!.getWorldstate('en')) {
          try {
            clearInterval(interval);
            this.logger.info('WorldState data already available');
            this.emitter!.removeListener('ws:update:parsed', handler);
            resolve();
          } catch (error) {
            reject(error);
          }
        }
      });

      this.logger.info('WorldState emitter initialized successfully');
      this.eventEmitter.emit('worldstate.ready');
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
