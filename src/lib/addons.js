import swagger from 'swagger-stats';
import helmet from 'helmet';
import cors from 'cors';
import expressShortCircuit from 'express-favicon-short-circuit';
import { sentry, release } from './settings.js';
import spec from '../api-spec/openapi.json' assert { type: 'json' };

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

// eslint-disable-next-line import/prefer-default-export
export const init = async (app) => {
  await initSentry(app);
  initSwagger(app);
  initSecurity(app);

  app.use(expressShortCircuit);
};
