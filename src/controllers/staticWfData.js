'use strict';

const express = require('express');

const router = express.Router();

const { logger, warframeData, solKeys } = require('../lib/utilities');

const dataKeys = Object.keys(warframeData);

const overwriteResults = (parent, results) => {
  if (parent) {
    parent = parent.concat(results);
  }
};

router.use((req, res, next) => {
  req.key = (req.baseUrl.replace('/', '').trim().split('/')[0] || '');

  dataKeys.forEach((dKey) => {
    if (req.key.toLowerCase() === dKey.toLowerCase()) {
      req.key = dKey;
    }
  });

  if (!Object.keys(warframeData).includes(req.key)) {
    req.key = undefined;
  }

  next();
});

router.get('/', /* cache('10 hours'), */ (req, res) => {
  logger.silly(`Got ${req.originalUrl}`);
  res.json(warframeData[req.key]);
});

router.get('/search/:query', /* cache('10 hours'), */ (req, res) => {
  logger.silly(`Got ${req.originalUrl}`);
  let values = [];
  let results = [];
  let keyResults = [];
  const nodeResults = [];
  const queries = req.params.query.split(',').map(q => q.trim());

  queries.forEach(async (q) => {
    const loweredQuery = q.toLowerCase();
    let value;
    switch (req.key) {
      case 'arcanes':
        results = warframeData.arcanes
          .filter(arcanes => (new RegExp(arcanes.regex)).test(loweredQuery)
            || arcanes.name.toLowerCase().includes(loweredQuery.toLowerCase()));
        value = results.length > 0 ? results : [];
        break;

      case 'tutorials':
        results = warframeData.tutorials
          .filter(tutorial => (new RegExp(tutorial.regex)).test(loweredQuery)
            || tutorial.name.toLowerCase().includes(loweredQuery));
        value = results.length > 0 ? results : [];
        break;

      case 'solNodes':
        keyResults = solKeys
          .filter(solNodeKey => solNodeKey.toLowerCase().includes(loweredQuery));
        solKeys.forEach((solKey) => {
          if (warframeData.solNodes[solKey]
            && warframeData.solNodes[solKey].value.toLowerCase().includes(loweredQuery)) {
            nodeResults.push(warframeData.solNodes[solKey]);
          }
        });
        if (values[0]) {
          overwriteResults(values[0].keys, keyResults);
          overwriteResults(values[0].nodes, nodeResults);
        } else {
          // eslint-disable-next-line no-case-declarations
          value = { keys: keyResults, nodes: nodeResults };
        }
        break;

      case 'synthTargets':
        results = [];
        // Loop through the synth targets, checking if the name contains the search string
        warframeData.synthTargets.forEach((synth) => {
          if (synth.name.toLowerCase().includes(loweredQuery)) {
            results.push(synth);
          }
        });
        value = results;
        break;

      default:
        Object.keys(warframeData[req.key]).forEach((selectedDataKey) => {
          if (selectedDataKey.toLowerCase().includes(loweredQuery)) {
            results.push(warframeData[req.key][selectedDataKey]);
          }
        });
        value = results;
        break;
    }
    if (value) {
      values = values.concat(value);
    }
  });

  if (req.key === 'solNodes' && values[0]) {
    values[0] = {
      keys: Array.from(new Set(values[0].keys)),
      nodes: Array.from(new Set(values[0].nodes)),
    };
  }
  res.json(values);
});

module.exports = router;
