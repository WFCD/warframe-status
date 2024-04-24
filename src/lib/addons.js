import cluster from 'node:cluster';

import cors from 'cors';
import { CronJob } from 'cron';
import expressShortCircuit from 'express-favicon-short-circuit';
import helmet from 'helmet';
import swagger from 'swagger-stats';

import spec from '../api-spec/openapi.json' assert { type: 'json' };

import hydrate from './hydrate.js';
import { release, sentry } from './settings.js';

// Some dependency/config stuff
// const adminCred = { user, pass };
// const isProd = env === 'production';

const initSentry = async (app) => {
  if (sentry) {
    // eslint-disable-next-line global-require
    const Sentry = await import('@sentry/node');
    const { Integrations: TracingIntegrations } = await import('@sentry/tracing');
    Sentry.init({
      dsn: sentry,
      release: `${release.name}@${release.version}`,
      integrations: [
        new TracingIntegrations.BrowserTracing({
          tracingOrigins: ['api.warframestat.us'],
        }),
      ],
      sampleRate: 0.25,
    });
    app.use(Sentry.Handlers.requestHandler());
    app.use(Sentry.Handlers.errorHandler());
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
  await initSentry(app);
  initSwagger(app);
  initSecurity(app);
  initHydration();

  app.use(expressShortCircuit);
};

export default init;
