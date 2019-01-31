'use strict';

const Route = require('../Route.js');

class Search extends Route {
  
  constructor(route, deps, routes) {
    super(route, deps);
    
    this.rs = {
      items: routes.items,
      warframes: routes.warframes,
      weapons: routes.weapons,
      mods: routes.mods,
    };
  }
  
  async handle(req, res) {
    this.logger.log('silly', `Got ${req.originalUrl}`);
    if (!this.wfKeys.includes(req.params.key)) {
      res.status(404).end();
      return;
    }
    this.logger.log('debug', 'Generic Data Retrieval - Search');
    this.setHeadersAndJson(res,
      await this.handleSearch(req.params.key, req.params.query.trim(), req.query));
  }

  async handleSearch(key, query, opts) {
    let values = [];
    let results = [];
    let keyResults = [];
    const nodeResults = [];
    const queries = query.split(',').map(q => q.trim());
    
    let dropData;
    
    if (key === 'drops') {
      dropData = await this.dropCache.getData();
    }

    queries.forEach(async (q) => {
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
          results = dropData.filter(drop => drop.place.toLowerCase().includes(q)
            || drop.item.toLowerCase().includes(q));
          value = results.length > 0 ? results : [];
          if (opts.grouped_by && opts.grouped_by === 'location') {
            value = this.groupLocation(value);
          }
          break;
        case 'warframes':
          value = this.rs.warframes.handleSearch(query);
          break;
        case 'weapons':
          value = this.rs.weapons.handleSearch(query);
          break;
        case 'mods':
          value = this.rs.mods.handleSearch(query);
          break;
        case 'items':
          value = this.rs.items.handleSearch(loweredQuery);
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
        case 'synthtargets':
          let matches = [];
          // Loop through the synth targets, checking if the name contains the search string
          this.warframeData.synthTargets.forEach((synth) => {
            if (synth.name.toLowerCase().includes(query.toLowerCase())) {
              matches.push(synth);
            }
          });
          value = matches;
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
