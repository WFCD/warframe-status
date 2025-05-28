import express from 'express';

import { warframeData, solKeys, cache, trimPlatform } from '../lib/utilities.js';

const router = express.Router();
const dataKeys = Object.keys(warframeData);

const overwriteResults = (parent, results) => parent.concat(results);

router.use((req, res, next) => {
  req.key = trimPlatform(req.baseUrl);

  dataKeys.forEach((dKey) => {
    if (req.key.toLowerCase() === dKey.toLowerCase()) {
      req.key = dKey;
    }
  });

  next();
});

router.get('/', cache('10 hours'), (req, res) => {
  res.setHeader('Content-Language', req.language);
  return res.status(200).json(warframeData[req.language][req.key]);
});

router.get(['/search/:query/', '/search/:query'], cache('10 hours'), (req, res) => {
  res.setHeader('Content-Language', req.language);
  let values = [];
  let results = [];
  let keyResults = [];
  const nodeResults = [];
  const queries = req.params.query.split(',').map((q) => q.trim());
  const errors = [];

  try {
    queries.forEach((q) => {
      const loweredQuery = q.toLowerCase();
      let value;
      switch (req.key) {
        case 'arcanes':
          results = warframeData[req.language].arcanes.filter(
            (arcanes) =>
              new RegExp(arcanes.regex).test(loweredQuery) ||
              arcanes.name.toLowerCase().includes(loweredQuery.toLowerCase())
          );
          value = results.length > 0 ? results : [];
          break;

        case 'tutorials':
          results = warframeData.tutorials.filter(
            (tutorial) =>
              new RegExp(tutorial.regex).test(loweredQuery) || tutorial.name.toLowerCase().includes(loweredQuery)
          );
          value = results.length > 0 ? results : [];
          break;

        case 'solNodes':
          keyResults = solKeys.filter((solNodeKey) => solNodeKey.toLowerCase().includes(loweredQuery));
          solKeys.forEach((solKey) => {
            if (
              warframeData[req.language].solNodes[solKey] &&
              warframeData[req.language].solNodes[solKey].value.toLowerCase().includes(loweredQuery)
            ) {
              nodeResults.push(warframeData[req.language].solNodes[solKey]);
            }
          });
          if (values[0]) {
            values[0].keys = overwriteResults(values[0].keys, keyResults);
            values[0].nodes = overwriteResults(values[0].nodes, nodeResults);
          } else {
            // eslint-disable-next-line no-case-declarations
            value = { keys: keyResults, nodes: nodeResults };
          }
          break;

        case 'synthTargets':
          results = [];
          // Loop through the synth targets, checking if the name contains the search string
          warframeData[req.language].synthTargets.forEach((synth) => {
            if (synth.name.toLowerCase().includes(loweredQuery)) {
              results.push(synth);
            }
          });
          value = results;
          break;

        default:
          Object.keys(warframeData[req.language][req.key] || warframeData[req.key]).forEach((selectedDataKey) => {
            if (selectedDataKey.toLowerCase().includes(loweredQuery)) {
              results.push((warframeData[req.language][req.key] || warframeData[req.key])[selectedDataKey]);
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
    return res.status(200).json(values);
  } catch (e) /* istanbul ignore next */ {
    errors.push(e.message);
    return res.status(500).json({ errors, code: 200 });
  }
});

export default router;
