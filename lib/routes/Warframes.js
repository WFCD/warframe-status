'use strict';

const Items = require('warframe-items');
const Route = require('../Route.js');

const warframes = new Items({ category: ['Warframes'] });

class Warframes extends Route {
  async handle(req, res) {
    this.setHeadersAndJson(res, warframes);
  }

  async handleSingle(req, res) {
    let result;
    let exact = false;
    warframes.forEach(warframe => {
      if (warframe.name.toLowerCase() === req.params.item.toLowerCase()) {
        result = warframe;
        exact = true;
      }
      if (warframe.name.toLowerCase().indexOf(req.params.item.toLowerCase()) > -1 && !exact) {
        result = warframe;
      }
    });
    if (result) {
      this.setHeadersAndJson(res, result);
    } else {
      res.status(404).send('No such Warframe.').end();
    }
  }

  handleSearch(query) {
    const value = [];
    warframes
      .forEach((frame) => {
        if (frame.name.toLowerCase().indexOf(query) > -1) {
          value.push(frame);
        }
      });
    return value;
  }
}

module.exports = Warframes;
