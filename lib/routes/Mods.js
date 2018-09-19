'use strict';

const Items = require('warframe-items');
const Route = require('../Route.js');

const mods = new Items({ category: ['Mods'] });

class Mods extends Route {
  async handle(req, res) {
    this.setHeadersAndJson(res, mods);
  }
}

module.exports = Mods;
