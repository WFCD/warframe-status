'use strict';

const express = require('express');
const helmet = require('helmet');

const { logger } = require('./lib/utilities');

/* Routes */
// const Route = require('./lib/Route');
// const WorldstateData = require('./lib/routes/WorldstateData');
// const Search = require('./lib/routes/Search');
// const PriceCheck = require('./lib/routes/PriceCheck');

logger.info('Setting up dependencies...');


// const routes = {
//   route: new Route('/', deps),
//   priceCheck: new PriceCheck('/pricecheck/:type/:query', deps),
// };

// routes.search = new Search('/:key/search/:query', deps, routes);

const app = express();
app.use(helmet());
app.use(express.json());

logger.info('Setting up routes...');
app.use(require('./controllers'));

// app.get('/:key', cache('1 minute'), async (req, res) => {
//   logger.log('silly', `Got ${req.originalUrl}`);
//   const key = (req.params.key || '').toLowerCase();
//   // platform
//   if (platforms.includes(key)) {
//     await routes.worldstate.handle(req, res);
//   // all drops
//   } else if (wfKeys.includes(key)) {
//     await routes.data.handle(req, res);
//   // routes listing
//   } else if (key === 'routes') {
//     routes.route.handle(req, res);
//   } else {
//     res.status(404).end();
//   }
// });


// // Search via query key
// app.get('/:key/search/:query', cache('10 hours'), async (req, res) => {
//   await routes.search.handle(req, res);
// });
//
// // Pricecheck
// app.get('/pricecheck/:type/:query', cache('10 minutes'), async (req, res) => {
//   await routes.priceCheck.handle(req, res);
// });

// oh no, nothing
app.use((req, res) => {
  res.status(404).end();
});

const port = process.env.PORT || 3001;
const host = process.env.HOSTNAME || process.env.HOST || process.env.IP || 'localhost';
app.listen(port, host);

logger.info(`Started listening on ${host}:${port}`);
