import { LOG_LEVEL } from '@nest/config/env';
import { LogLevel } from '@nest/config/log-level';
import {
  Injectable,
  type LoggerService as NestLoggerService,
  Scope,
} from '@nestjs/common';
import colors from 'colors';
import {
  addColors,
  createLogger,
  format,
  transports,
  type Logger as WinstonLogger,
} from 'winston';

const { combine, label, printf, colorize, timestamp } = format;

export enum LogScope {
  PROC = 'PROC',
  REST = 'REST',
  SOCK = 'SOCK',
  BUILD = 'BUILD',
  CACHE = 'CACHE',
  HTTP = 'HTTP',
  NEST = 'NEST',
  WORLDSTATE = 'WORLDSTATE',
  DROPS = 'DROPS',
  HYDRATE = 'HYDRATE',
  ITEMS = 'ITEMS',
  RIVENS = 'RIVENS',
  TWITCH = 'TWITCH',
  WFINFO = 'WFINFO',
}

export { fromString, LogLevel } from '@nest/config/log-level';

export const LogLevelColors: Record<LogLevel, string> = {
  [LogLevel.FATAL]: 'red',
  [LogLevel.ERROR]: 'red',
  [LogLevel.WARN]: 'yellow',
  [LogLevel.INFO]: 'gray',
  [LogLevel.DEBUG]: 'green',
  [LogLevel.SILLY]: 'black',
};

@Injectable({ scope: Scope.TRANSIENT })
export class LoggerService implements NestLoggerService {
  private logger: WinstonLogger;
  private context: LogScope;

  constructor() {
    this.context = LogScope.NEST;
    this.logger = this.createLogger(this.context);
    this.logger.level = LOG_LEVEL;
  }

  get level() {
    return this.logger.level as LogLevel;
  }

  set level(level: LogLevel) {
    this.logger.level = level;
  }

  setContext(context: LogScope): void {
    this.context = context;
    this.logger = this.createLogger(context);
  }

  private colorizeScope(scope: LogScope): string {
    switch (scope.toUpperCase()) {
      case LogScope.TWITCH:
      case LogScope.RIVENS:
      case LogScope.PROC:
        return colors.magenta(scope);
      case LogScope.REST:
      case LogScope.WORLDSTATE:
      case LogScope.HTTP:
        return colors.cyan(scope);
      case LogScope.SOCK:
        return colors.yellow(scope);
      case LogScope.BUILD:
      case LogScope.HYDRATE:
        return colors.america(scope);
      case LogScope.CACHE:
        return colors.blue(scope);
      default:
        return colors.white(scope);
    }
  }

  private createLogger(scope: LogScope): WinstonLogger {
    const transport = new transports.Console({
      format: colorize({ all: true }),
    });

    const logFormat = printf((info) => {
      const labelText = this.colorizeScope(scope);
      return `[${labelText}] ${info.level}: ${info.message}`;
    });

    const logger = createLogger({
      level: LOG_LEVEL,
      format: combine(
        colorize(),
        timestamp(),
        label({ label: this.colorizeScope(scope) }),
        logFormat,
      ),
      transports: [transport],
      levels: {
        [LogLevel.FATAL]: 0,
        [LogLevel.ERROR]: 1,
        [LogLevel.WARN]: 2,
        [LogLevel.INFO]: 3,
        [LogLevel.DEBUG]: 4,
        [LogLevel.SILLY]: 5,
      },
    });
    addColors(LogLevelColors);
    return logger;
  }

  log(message: string): void {
    this.logger.info(message);
  }

  error(message: string, trace?: string): void {
    this.logger.error(message);
    if (trace) {
      this.logger.error(trace);
    }
  }

  warn(message: string): void {
    this.logger.warn(message);
  }

  debug(message: string): void {
    this.logger.debug(message);
  }

  verbose(message: string): void {
    this.logger.verbose(message);
  }

  info(message: string, alwaysLog?: boolean): void {
    const originalLevel = this.logger.level;
    if (alwaysLog) {
      this.logger.level = LogLevel.SILLY;
    }
    this.logger.info(message);
    if (alwaysLog) {
      this.logger.level = originalLevel;
    }
  }

  silly(message: string): void {
    this.logger.silly(message);
  }

  setLevel(level: string): void {
    this.logger.level = level;
  }

  /** Underlying Winston instance for libraries that expect winston.Logger. */
  getWinston(): WinstonLogger {
    return this.logger;
  }
}
