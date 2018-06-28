'use strict';

const Items = require('warframe-items');
const Route = require('../Route.js');

const warframes = new Items({ category: ['Warframes'] });

class Warframes extends Route {
  async handle(req, res) {
    this.setHeadersAndJson(res, warframes);
  }
}

module.exports = Warframes;
