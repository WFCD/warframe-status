'use strict';

const Route = require('../Route.js');

class Drops extends Route {
  async handle(req, res) {
    this.setHeadersAndJson(res, await this.dropCache.getData());
  }
}

module.exports = Drops;
