import express from 'express';
import { dirname } from 'node:path';
import { fileURLToPath } from 'url';
import * as addons from './lib/addons.js';
import { logger } from './lib/utilities.js';
import controllers from './controllers/index.js';

const app = express();

/* istanbul ignore next */ if (!global?.__basedir) {
  // eslint-disable-next-line no-global-assign
  __dirname = dirname(fileURLToPath(import.meta.url));
  global.__basedir = __dirname;
}

// middleware
app.use(express.json());
await addons.init(app);

// actual api routes
logger.info('Setting up routes...');
app.use(controllers);

// oh no, nothing...fallback catch-all
app.use((req, res) => {
  res.status(404).json({ error: 'No such route.', code: 404 }).end();
});
logger.info('Routes up');

export default app;
