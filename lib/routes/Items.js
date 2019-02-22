'use strict';

const Items = require('warframe-items');
const Route = require('../Route.js');

class ItemsRoute extends Route {
  constructor(route, deps) {
    super(route, deps);

    this.items = new Items();
  }

  async handle(req, res) {
    this.setHeadersAndJson(res, this.items);
  }

  async handleSingle(req, res) {
    let result;
    let exact = false;
    this.items.forEach((item) => {
      if (item.name.toLowerCase() === req.params.item.toLowerCase()) {
        result = item;
        exact = true;
      }
      if (item.name.toLowerCase().indexOf(req.params.item.toLowerCase()) > -1 && !exact) {
        result = item;
      }
    });
    if (result) {
      this.setHeadersAndJson(res, result);
    } else {
      res.status(404).send('No such item.').end();
    }
  }

  handleSearch(query) {
    const value = [];
    let exact;
    this.items
      .forEach((item) => {
        if (item.name.toLowerCase() === query.toLowerCase() && !exact) {
          exact = item;
        } else if (item.name.toLowerCase().indexOf(query.toLowerCase()) > -1) {
          value.push(item);
        }
      });
    if (exact) {
      value.unshift(exact);
    }
    return value;
  }
}

module.exports = ItemsRoute;
