'use strict';

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
  host: process.env.HOSTNAME || process.env.HOST || process.env.IP || 'localhost',
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
};

module.exports = process.env.NODE_ENV === 'test' ? settings : Object.freeze(settings);
