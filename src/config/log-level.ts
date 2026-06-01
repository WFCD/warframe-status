export enum LogLevel {
  FATAL = 'fatal',
  ERROR = 'error',
  WARN = 'warn',
  INFO = 'info',
  DEBUG = 'debug',
  SILLY = 'silly',
}

export const fromString = (level?: string): LogLevel => {
  if (!level) return LogLevel.ERROR;
  if (Object.values(LogLevel).includes(level as LogLevel)) {
    return level as LogLevel;
  }
  return LogLevel.ERROR;
};
