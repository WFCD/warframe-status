'use strict';

const Route = require('../Route.js');
const Cache = require('../cache.js');
const Worldstate = require('warframe-worldstate-parser');

const platforms = ['pc', 'ps4', 'xb1'];
const parser = function parser(data) {
  return new Worldstate(data);
};

const worldStates = {};

platforms.forEach((p) => {
  const url = `http://content${p === 'pc' ? '' : `.${p}`}.warframe.com/dynamic/worldState.php`;
  worldStates[p] = new Cache(url, process.env.CACHE_TIMEOUT || 60000, { parser });
  worldStates[p].startUpdating();
});

class WorldstateRoute extends Route {
  async handle(req, res) {
    this.logger.log('silly', `Got ${req.originalUrl}`);
    if (!req.params.item) {
      try {
        this.logger.log('debug', 'Worldstate Data Retrieval');
        const data = await worldStates[req.params.key.toLowerCase()].getData();
        this.setHeadersAndJson(res, data);
      } catch (e) {
        this.logger.error(e);
      }
    } else {
      if (!this.platforms.includes(req.params.platform) || !this.items.includes(req.params.item)) {
        res.status(404).end();
        return;
      }
      worldStates[req.params.platform].getData().then((data) => {
        this.setHeadersAndJson(res, data[req.params.item]);
      }).catch(this.logger.error);
    }
  }
}

module.exports = WorldstateRoute;
