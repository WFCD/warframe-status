'use strict';

// monitoring
const swagger = require('swagger-stats');
// security
const helmet = require('helmet');
const cors = require('cors');

const spec = require('../api-spec/openapi.json');

const {
  sentry,
  release,
  // admin: { user, pass },
  // env,
} = require('./settings');

// Some dependency/config stuff
// const adminCred = { user, pass };
// const isProd = env === 'production';

const initSentry = (app) => {
  if (sentry) {
    // eslint-disable-next-line global-require
    const Sentry = require('@sentry/node');
    const { Integrations: TracingIntegrations } = require('@sentry/tracing');
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
  // const swaggerAuth = (req, user, pass) => (!isProd || (user === adminCred.user && pass === adminCred.pass));
  const swaggConfig = {
    swaggerSpec: spec,
    uriPath: '/meta/status',
    // onAuthenticate: swaggerAuth,
    // authentication: isProd,
  };
  app.use(swagger.getMiddleware(swaggConfig));
};

const init = (app) => {
  initSentry(app);
  initSwagger(app);
  initSecurity(app);

  app.use(require('express-favicon-short-circuit'));
};

module.exports = { init };
