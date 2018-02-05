'use strict';

class Route {
  constructor(route, deps) {
    this.route = route;
    this.deps = deps;
    this.logger = deps.logger;
    this.dropCache = deps.dropCache;
    this.wfKeys = deps.wfKeys;
    this.platforms = deps.platforms;
    this.setHeadersAndJson = deps.setHeadersAndJson;
    this.warframeData = deps.warframeData;
    this.solKeys = deps.solKeys;
    this.items = [
      'news',
      'events',
      'alerts',
      'sortie',
      'syndicateMissions',
      'fissures',
      'globalUpgrades',
      'flashSales',
      'invasions',
      'darkSectors',
      'voidTrader',
      'dailyDeals',
      'simaris',
      'conclaveChallenges',
      'persistentEnemies',
      'cetusCycle',
      'constructionProgress',
      'earthCycle',
      'timestamp',
    ];
  }

  async handle(req, res) {
    this.logger.log('silly', `Got ${req.originalUrl}`);
    this.setHeadersAndJson(res, [].concat(this.wfKeys).concat(['pc', 'ps4', 'xb1']));
  }
}

module.exports = Route;
