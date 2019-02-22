'use strict';

const Items = require('warframe-items');
const Route = require('../Route.js');

class Warframes extends Route {
  constructor(route, deps) {
    super(route, deps);

    this.warframes = new Items({ category: ['Warframes'] });
  }

  async handle(req, res) {
    this.setHeadersAndJson(res, this.warframes);
  }

  async handleSingle(req, res) {
    let result;
    let exact = false;
    this.warframes.forEach((warframe) => {
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
    this.warframes
      .forEach((frame) => {
        if (frame.name.toLowerCase().indexOf(query) > -1) {
          value.push(frame);
        }
      });
    return value;
  }
}

module.exports = Warframes;
