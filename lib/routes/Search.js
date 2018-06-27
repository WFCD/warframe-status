'use strict';

const Items = require('warframe-items');
const Route = require('../Route.js');

const warframes = new Items({ category: ['Warframes'] });
const weapons = new Items({ category: ['Primary', 'Secondary', 'Melee'] });

class Search extends Route {
  async handle(req, res) {
    this.logger.log('silly', `Got ${req.originalUrl}`);
    if (!this.wfKeys.includes(req.params.key)) {
      res.status(404).end();
      return;
    }
    this.logger.log('debug', 'Generic Data Retrieval - Search');
    this.setHeadersAndJson(res, await this.handleSearch(req.params.key, req.params.query.trim()));
  }

  async handleSearch(key, query) {
    let values = [];
    let results = [];
    let keyResults = [];
    const nodeResults = [];
    const queries = query.split(',').map(q => q.trim());
    let dropData;
    if (key === 'drops') {
      dropData = await this.dropCache.getData();
    }

    queries.forEach((q) => {
      const loweredQuery = q.toLowerCase();
      let value;
      switch (key) {
        case 'arcanes':
          results = this.warframeData.arcanes
            .filter(arcanes => (new RegExp(arcanes.regex)).test(loweredQuery)
              || arcanes.name.toLowerCase().includes(loweredQuery.toLowerCase()));
          value = results.length > 0 ? results : [];
          break;
        case 'drops':
          results = dropData.filter(drop => drop.place.toLowerCase().includes(loweredQuery)
            || drop.item.toLowerCase().includes(loweredQuery));
          value = results.length > 0 ? results : [];
          break;
        case 'warframes':
          value = [];
          warframes
            .forEach((frame) => {
              if (frame.name.toLowerCase().indexOf(loweredQuery) > -1) {
                value.push(frame);
              }
            });
          break;
        case 'weapons':
          value = [];
          weapons
            .forEach((weapon) => {
              if (weapon.name.toLowerCase().indexOf(loweredQuery) > -1) {
                value.push(weapon);
              }
            });
          break;
        case 'tutorials':
          results = this.warframeData.tutorials
            .filter(tutorial => (new RegExp(tutorial.regex)).test(loweredQuery)
              || tutorial.name.toLowerCase().includes(loweredQuery));
          value = results.length > 0 ? results : [];
          break;
        case 'solNodes':
          keyResults = this.solKeys
            .filter(solNodeKey => solNodeKey.toLowerCase().includes(loweredQuery));
          this.solKeys.forEach((solKey) => {
            if (this.warframeData.solNodes[solKey]
              && this.warframeData.solNodes[solKey].value.toLowerCase().includes(loweredQuery)) {
              nodeResults.push(this.warframeData.solNodes[solKey]);
            }
          });
          if (values[0]) {
            if (values[0].keys) {
              values[0].keys = values[0].keys.concat(keyResults);
            }
            if (values[0].nodes) {
              values[0].nodes = values[0].nodes.concat(nodeResults);
            }
          } else {
            // eslint-disable-next-line no-case-declarations
            value = { keys: keyResults, nodes: nodeResults };
          }
          break;
        default:
          Object.keys(this.warframeData[key]).forEach((selectedDataKey) => {
            if (selectedDataKey.toLowerCase().includes(q.toLowerCase())) {
              results.push(this.warframeData[key][selectedDataKey]);
            }
          });
          value = results;
          break;
      }
      if (value) {
        values = values.concat(value);
      }
    });

    if (key === 'solNodes' && values[0]) {
      values[0] = {
        keys: Array.from(new Set(values[0].keys)),
        nodes: Array.from(new Set(values[0].nodes)),
      };
    }
    return values;
  }
}

module.exports = Search;
