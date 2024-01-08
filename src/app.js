import express from 'express';
import initAddons from './lib/addons.js';
import { logger } from './lib/utilities.js';
import controllers from './controllers/index.js';

const app = express();

// middleware
app.use(express.json());
await initAddons(app);

// actual api routes
logger.info('Setting up routes...');
app.use(controllers);

// oh no, nothing...fallback catch-all
app.use((req, res) => {
  res.status(404).json({ error: 'No such route.', code: 404 }).end();
});
logger.info('Routes up');

export default app;
