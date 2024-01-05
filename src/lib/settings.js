import dns from 'node:dns/promises';
import { Address6, Address4 } from 'ip-address';
import dotenv from 'dotenv';
import makeLogger from './logger.js';

const env = process.env.NODE_ENV;

/* istanbul ignore next */ if (['development', 'test'].includes(env)) dotenv.config();

const logger = makeLogger('BOOTSTRAP');

// reshape ipv6 addresses to ipv4
const raw = process.env.HOSTNAME || process.env.HOST || process.env.IP || 'localhost';
let host;
try {
  if (Address6.isValid(raw)) {
    logger.info(`Oh look, ipv6 address... that won't do`);
    host = new Address6(raw).inspectTeredo().client4;
  } else if (Address4.isValid(raw)) {
    host = raw;
    logger.info('Nice, you gave an ip on the first try.');
  } else {
    logger.warn(`Not using an ip address? YOLO: ${raw}. Attempting to resolve...`);
    const addresses = await dns.resolve4(raw);
    const first = addresses.find((record, index) => index === 0);
    if (first) {
      logger.info(`Great Scott! ${first} should be an ipv4 address!`);
      host = first;
    } else {
      logger.error(`Still unable to resolve. You're on your own, Ghostrider.`);
    }
  }
} catch (error) {
  logger.error('Could not compensate');
  logger.error(error);
  process.exit(1);
}

const settings = {
  twitter: {
    active: process.env.TWITTER_TIMEOUT && process.env.TWITTER_SECRET && process.env.TWITTER_BEARER_TOKEN,
  },
  wfInfo: {
    filteredItems: process.env.WFINFO_FILTERED_ITEMS,
    prices: process.env.WFINFO_PRICES,
  },
  build: !!(process.env.BUILD && process.env.BUILD.trim().startsWith('build')),
  priceChecks: !process.env.DISABLE_PRICECHECKS,
  host,
  port: process.env.PORT || 3001,
  sentry: process.env.SENTRY_DSN,
  release: {
    name: process.env.npm_package_name,
    version: process.env.npm_package_version,
  },
  env,
  admin: {
    user: process.env.ADMIN_USER,
    pass: process.env.ADMIN_PASSWORD,
  },
  features: process.env.FEATURES?.split(',') || [],
};

export default process.env.NODE_ENV === 'test' ? settings : Object.freeze(settings);
