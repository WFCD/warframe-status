'use strict';

const Items = require('warframe-items');
const Route = require('../Route.js');

const weapons = new Items({ category: ['Primary', 'Secondary', 'Melee'] });

class Weapons extends Route {
  async handle(req, res) {
    this.setHeadersAndJson(res, weapons);
  }
  
  async handleSingle(req, res) {
    let result;
    let exact = false;
    weapons.forEach(weapon => {
      if (weapon.name.toLowerCase() === req.params.item.toLowerCase()) {
        result = weapon;
        exact = true;
      }
      if (weapon.name.toLowerCase().indexOf(req.params.item.toLowerCase()) > -1 && !exact) {
        result = weapon;
      }
    });
    if (result) {
      this.setHeadersAndJson(res, result);
    } else {
      res.status(404).send('No such weapon.').end();
    }
  }
  
  handleSearch(query) {
    const value = [];
    weapons
      .forEach((weapon) => {
        if (weapon.name.toLowerCase().indexOf(query) > -1) {
          value.push(weapon);
        }
      });
    return value;
  }
}

module.exports = Weapons;
