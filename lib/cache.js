'use strict';

const http = require('http');
const https = require('https');

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

  update() {
    this.updating = this.httpGet().then((data) => {
      this.currentData = this.parser(data);
      this.updating = null;
      return this.currentData;
    }).catch((err) => {
      this.updating = null;
      throw err;
    });
  }

  httpGet() {
    return new this.Promise((resolve, reject) => {
      const request = this.protocol.get(this.url, (response) => {
        if (response.statusCode < 200 || response.statusCode > 299) {
          reject(new Error(`Failed to load page, status code: ${response.statusCode}`));
        }
        const body = [];
        response.on('data', chunk => body.push(chunk));
        response.on('end', () => resolve(body.join('')));
      });
      request.on('error', err => reject(err));
    });
  }
}

module.exports = Cache;
