'use strict';

const Route = require('../Route.js');

class WorldstateData extends Route {
  async handle(req, res) {
    this.logger.log('silly', `Got ${req.originalUrl}`);
    if (!req.query.search) {
      this.setHeadersAndJson(res, this.warframeData[req.params.key]);
    } else {
      this.logger.log('debug', 'Generic Data Retrieval');
      this.setHeadersAndJson(res, await this.handleSearch(req.params.key, req.query.search.trim()));
    }
  }
}

module.exports = WorldstateData;
