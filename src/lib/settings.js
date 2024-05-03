import dns from 'node:dns/promises';

import dotenv from 'dotenv';
import { Address4, Address6 } from 'ip-address';

import makeLogger from './logger.js';

export const env = process.env.NODE_ENV;

/* istanbul ignore next */ if (['development', 'test'].includes(env)) dotenv.config();

const logger = makeLogger('BOOTSTRAP');

// reshape ipv6 addresses to ipv4
const raw = process.env.HOSTNAME || process.env.HOST || process.env.IP || 'localhost';
let resolved;
try {
  if (Address6.isValid(raw)) {
    logger.info(`Oh look, ipv6 address... that won't do`);
    resolved = new Address6(raw).inspectTeredo().client4;
  } else if (Address4.isValid(raw)) {
    resolved = raw;
    logger.info('Nice, you gave an ip on the first try.');
  } else {
    logger.warn(`Not using an ip address? YOLO: ${raw}. Attempting to resolve...`);
    const addresses = await dns.resolve4(raw);
    const first = addresses.find((record, index) => index === 0);
    if (first) {
      logger.info(`Great Scott! ${first} should be an ipv4 address!`);
      resolved = first;
    } else {
      logger.error(`Still unable to resolve. You're on your own, Ghostrider.`);
    }
  }
} catch (error) {
  logger.error('Could not compensate');
  logger.error(error);
  process.exit(1);
}
export const host = resolved;
export const port = process.env.PORT || 3001;

export const twitter = {
  active: process.env.TWITTER_TIMEOUT && process.env.TWITTER_SECRET && process.env.TWITTER_BEARER_TOKEN,
};
export const wfInfo = {
  filteredItems: process.env.WFINFO_FILTERED_ITEMS,
  prices: process.env.WFINFO_PRICES,
};
export const build = !!(process.env.BUILD && process.env.BUILD.trim().startsWith('build'));
export const priceChecks = !process.env.DISABLE_PRICECHECKS;
export const sentry = process.env.SENTRY_DSN;
export const release = {
  name: process.env.npm_package_name,
  version: process.env.npm_package_version,
};
export const admin = {
  user: process.env.ADMIN_USER,
  pass: process.env.ADMIN_PASSWORD,
};
export const features = process.env.FEATURES?.split(',') || [];

export const wfApi = {
  profile: 'https://content.warframe.com/dynamic/getProfileViewingData.php',
  arsenal: {
    id: 'ud1zj704c0eb1s553jbkayvqxjft97',
    api: 'https://content.warframe.com/dynamic/twitch/getActiveLoadout.php',
  },
};

const settings = {
  twitter,
  wfInfo,
  build,
  priceChecks: priceChecks ?? false,
  host,
  port,
  sentry,
  release,
  env,
  admin,
  features,
  wfApi,
};

export default process.env.NODE_ENV === 'test' ? settings : Object.freeze(settings);
