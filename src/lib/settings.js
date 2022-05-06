'use strict';

module.exports = class Settings {
  static #twitter = {
    active: process.env.TWITTER_TIMEOUT
      && process.env.TWITTER_SECRET
      && process.env.TWITTER_BEARER_TOKEN,
  };

  static #wfInfo = {
    filteredItems: process.env.WFINFO_FILTERED_ITEMS,
    prices: process.env.WFINFO_PRICES,
  };

  static #build = !!(process.env.BUILD && process.env.BUILD.trim().startsWith('build'));

  static #priceChecks = !!(process.env.DISABLE_PRICECHECKS);

  static get build() { return this.#build; }

  static get isTwitterActive() { return this.#twitter.active; }

  static get priceChecks() { return this.#priceChecks; }

  static get wfInfo() {
    return this.#wfInfo;
  }
};
