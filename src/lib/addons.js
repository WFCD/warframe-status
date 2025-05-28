import cluster from 'node:cluster';

import cors from 'cors';
import { CronJob } from 'cron';
import expressShortCircuit from 'express-favicon-short-circuit';
import helmet from 'helmet';
import swagger from 'swagger-stats';
import * as Sentry from '@sentry/node';

import spec from '../api-spec/openapi.json' with { type: 'json' };

import hydrate from './hydrate.js';
import { sentry } from './settings.js';

// Some dependency/config stuff
// const adminCred = { user, pass };
// const isProd = env === 'production';

export const initSentry = async (app) => {
  if (sentry) {
    Sentry.setupConnectErrorHandler(app);
  }
};

const initSecurity = (app) => {
  app.use(cors());
  app.use(helmet());
};

const initSwagger = (app) => {
  // eslint-disable-next-line max-len
  // const swaggerAuth = (req, user, pass) => (!isProd || (user === admin.user && pass === admin.pass));
  const swaggConfig = {
    swaggerSpec: spec,
    uriPath: '/meta/status',
    // onAuthenticate: swaggerAuth,
    // authentication: isProd,
  };
  app.use(swagger.getMiddleware(swaggConfig));
};

const initHydration = async () => {
  if (!cluster.isPrimary) return;
  await hydrate();
  // Run every hour
  const hydration = new CronJob('0 0 * * * *', hydrate, undefined, true);
  hydration.start();
};

const init = async (app) => {
  initSwagger(app);
  initSecurity(app);
  initHydration();

  app.use(expressShortCircuit);
};

export default init;
