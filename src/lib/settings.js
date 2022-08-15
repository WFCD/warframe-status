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
};

module.exports = process.env.NODE_ENV === 'test' ? settings : Object.freeze(settings);
