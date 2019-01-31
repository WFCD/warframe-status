'use strict';

const Route = require('../Route.js');

class Drops extends Route {
  constructor(route, deps) {
    super(route, deps);
  }
  
  async handle(req, res) {
    const data = await this.dropCache.getData();
    if (req.query.grouped_by && req.query.grouped_by === 'location') {
      this.setHeadersAndJson(res, this.groupLocation(data));
    } else {
      this.setHeadersAndJson(res, data);
    }
  }

  async handleSearch(q, opts) {
    const data = await this.dropCache.getData();
    
    const results = data.filter(drop => drop.place.toLowerCase().includes(q)
      || drop.item.toLowerCase().includes(q));
    let value = results.length > 0 ? results : [];
    if (opts.grouped_by && opts.grouped_by === 'location') {
      value = this.groupLocation(value);
    }
    return value;
  }
}

module.exports = Drops;
