'use strict';

const Items = require('warframe-items');
const Route = require('../Route.js');

const weapons = new Items({ category: ['Primary', 'Secondary', 'Melee'] });

class Weapons extends Route {
  async handle(req, res) {
    this.setHeadersAndJson(res, weapons);
  }
}

module.exports = Weapons;
