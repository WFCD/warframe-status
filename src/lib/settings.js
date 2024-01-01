'use strict';

const dns = require('dns');
const logger = require('./logger')('BOOTSTRAP');

// reshape ipv6 addresses to ipv4
// TODO: Rewrite this async fully so we don't ever have an undefined value
const raw = process.env.HOSTNAME || process.env.HOST || process.env.IP || 'localhost';
let host;
try {
  logger.warn(`Not using an ip address? YOLO: ${raw}. Attempting to resolve...`);
  dns.resolve4(raw, undefined, (err, addresses) => {
    if (err) {
      logger.error(err);
      process.exit(1);
    }
    const first = addresses.find((record, index) => index === 0);
    if (first) {
      logger.info(`Great Scott! ${first} should be an ipv4 address!`);
      host = first;
    } else {
      logger.error(`Still unable to resolve. You're on your own, Ghostrider.`);
    }
  });
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
  env: process.env.NODE_ENV,
  admin: {
    user: process.env.ADMIN_USER,
    pass: process.env.ADMIN_PASSWORD,
  },
  features: process.env.FEATURES?.split(',') || [],
};

module.exports = process.env.NODE_ENV === 'test' ? settings : Object.freeze(settings);
