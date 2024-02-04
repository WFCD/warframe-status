import 'colors';
import { transports, createLogger, format } from 'winston';

const { combine, label, printf, colorize } = format;

const color = (scope = 'PROC') => {
  let scoped;
  switch (scope.toUpperCase()) {
    case 'PROC':
      scoped = 'PROC'.magenta;
      break;
    case 'REST':
      scoped = 'REST'.cyan;
      break;
    case 'SOCK':
      scoped = 'SOCK'.yellow;
      break;
    case 'BUILD':
      scoped = 'BUILD'.green;
      break;
    default:
      scoped = scope.toUpperCase().red;
      break;
  }
  return scoped;
};

/**
 * Create a colorized scope
 * @param  {string} [scope] process scope
 * @returns {Object}       set up logger
 */
const setup = (scope = 'PROC') => {
  /* Logger setup */
  const transport = new transports.Console({ colorize: true });
  const logFormat = printf((info) => `[${info.label}] ${info.level}: ${info.message}`);
  const logger = createLogger({
    format: combine(colorize(), label({ label: color(scope) }), logFormat),
    transports: [transport],
  });
  logger.level = process.env.LOG_LEVEL || 'error';
  return logger;
};

export default setup;
