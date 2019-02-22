'use strict';

const Items = require('warframe-items');
const Route = require('../Route.js');

class Mods extends Route {
  constructor(route, deps) {
    super(route, deps);

    this.mods = new Items({ category: ['Mods'] });
  }

  async handle(req, res) {
    this.setHeadersAndJson(res, this.mods);
  }

  async handleSingle(req, res) {
    let result;
    let exact = false;
    this.mods.forEach((mod) => {
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

  handleSearch(query) {
    const value = [];
    this.mods
      .forEach((mod) => {
        if (mod.name.toLowerCase().indexOf(query) > -1) {
          value.push(mod);
        }
      });
    return value;
  }
}

module.exports = Mods;
