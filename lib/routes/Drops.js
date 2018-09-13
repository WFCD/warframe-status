'use strict';

const Route = require('../Route.js');

class Drops extends Route {
  async handle(req, res) {
    const data = await this.dropCache.getData();
    if (req.query.grouped_by && req.query.grouped_by === 'location') {
      this.setHeadersAndJson(res, this.groupLocation(data));
    } else {
      this.setHeadersAndJson(res, data);
    }
  }
}

module.exports = Drops;
