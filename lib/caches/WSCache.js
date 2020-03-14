'use strict';

const Worldstate = require('warframe-worldstate-parser');
const EventEmitter = require('events');

class WSCache extends EventEmitter {
  constructor(platform, language, kuvaCache, sentientCache) {
    super();
    this.inner = null;
    Object.defineProperty(this, 'inner', { enumerable: false, configurable: false });

    this.kuvaCache = kuvaCache;
    Object.defineProperty(this, 'kuvaCache', { enumerable: false, configurable: false });

    this.sentientCache = sentientCache;
    Object.defineProperty(this, 'sentientCache', { enumerable: false, configurable: false });

    this.platform = platform;
    this.language = language;
  }

  get data() {
    return this.inner;
  }

  set data(newData) {
    setTimeout(async () => {
      const t = new Worldstate(newData, {
        locale: this.language,
        kuvaData: await this.kuvaCache.getData(),
        sentientData: await this.sentientCache.getData(),
        kuvaCache: this.kuvaCache,
        sentientCache: this.sentientCache,
      });
      if (!t.timestamp) return;
      this.inner = t;
      this.emit('update', newData);
    }, 1000);
  }

  set twitter(newTwitter) {
    if (!this.inner || !(newTwitter && newTwitter.length)) return;
    this.inner.twitter = newTwitter;
  }
}

module.exports = WSCache;
