'use strict';

const Items = require('warframe-items');
const Route = require('../Route.js');

const mods = new Items({ category: ['Mods'] });

class Mods extends Route {
  async handle(req, res) {
    this.setHeadersAndJson(res, mods);
  }
  
  async handleSingle(req, res) {
    let result;
    let exact = false;
    mods.forEach(mod => {
      if (mod.name.toLowerCase() === req.params.item.toLowerCase()) {
        result = mod;
        exact = true;
      }
      if (mod.name.toLowerCase().indexOf(req.params.item.toLowerCase()) > -1 && !exact) {
        result = mod;
      }
    });
    if (result) {
      this.setHeadersAndJson(res, result);
    } else {
      res.status(404).send('No such Mod.').end();
    }
  }
}

module.exports = Mods;
