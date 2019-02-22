'use strict';

const Worldstate = require('warframe-worldstate-parser');
const Route = require('../Route.js');
const Cache = require('../caches/cache.js');
const TwitterCache = require('../caches/TwitterCache.js');

const platforms = ['pc', 'ps4', 'xb1', 'swi'];
const parser = function parser(data) {
  return new Worldstate(data);
};

const worldStates = {};

platforms.forEach((p) => {
  const url = `http://content${p === 'pc' ? '' : `.${p}`}.warframe.com/dynamic/worldState.php`;
  worldStates[p] = new Cache(url, process.env.CACHE_TIMEOUT || 60000, { parser });
  worldStates[p].startUpdating();
});

const twitterCache = new TwitterCache();

const extras = ['twitter'];

class WorldstateRoute extends Route {
  constructor(route, deps) {
    super(route, deps);
    twitterCache.setLogger(this.logger);
  }

  async handle(req, res) {
    this.logger.log('silly', `Got ${req.originalUrl}`);
    if (!req.params.item) {
      try {
        const data = await worldStates[req.params.key.toLowerCase()].getData();
        data.twitter = await twitterCache.getData();
        this.setHeadersAndJson(res, data);
      } catch (e) {
        this.logger.log('error', e);
      }
    } else {
      if (!this.platforms.includes(req.params.platform) || !this.items.includes(req.params.item)) {
        res.status(404).end();
        return;
      }
      if (!extras.includes(req.params.item)) {
        try {
          const data = await worldStates[req.params.platform].getData();
          this.setHeadersAndJson(res, data[req.params.item]);
        } catch (error) {
          this.logger.error(error);
        }
      } else {
        switch (req.params.item) {
          case 'twitter':
            this.setHeadersAndJson(res, await twitterCache.getData());
            break;
          default:
            res.status(404).end();
        }
      }
    }
  }
}

module.exports = WorldstateRoute;
