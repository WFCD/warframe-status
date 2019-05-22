'use strict';

const http = require('http');
const https = require('https');

const fetch = require('node-fetch');

class Cache {
  constructor(url, timeout, { parser, promiseLib = Promise } = {}) {
    this.url = url;
    this.protocol = this.url.startsWith('https') ? https : http;

    this.timeout = timeout;
    this.currentData = null;
    this.updating = null;
    this.Promise = promiseLib;
    this.parser = parser;
  }

  getData() {
    if (this.updating) {
      return this.updating;
    }
    return this.Promise.resolve(this.currentData);
  }

  startUpdating() {
    this.updateInterval = setInterval(() => this.update(), this.timeout);
    this.update();
  }

  stopUpdating() {
    clearInterval(this.updateInterval);
  }

  async update() {
    this.updating = fetch(this.url)
      .then(body => body.text())
      .then((data) => {
        this.currentData = this.parser(data);
        this.updating = null;
        return this.currentData;
      }).catch((err) => {
        this.updating = null;
        // eslint-disable-next-line no-console
        console.error(err);
      });
  }
}

module.exports = Cache;
