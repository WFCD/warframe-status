'use strict';

const Items = require('warframe-items');
const Route = require('../Route.js');

const items = new Items();

class ItemsRoute extends Route {
  async handle(req, res) {
    this.setHeadersAndJson(res, items);
  }
  
  async handleSingle(req, res) {
    let result;
    let exact = false;
    items.forEach(item => {
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
    items
      .forEach((item) => {
        if (item.name.toLowerCase().indexOf(query) > -1) {
          value.push(item);
        }
      });
    return value;
  }
}

module.exports = ItemsRoute;
