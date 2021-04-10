'use strict';

// monitoring
const swagger = require('swagger-stats');

// security
const helmet = require('helmet');
const cors = require('cors');

const spec = require('../api-spec/openapi.json');

// Some dependency/config stuff
// const adminCred = { user: process.env.ADMIN_USER, pass: process.env.ADMIN_PASS };
// const isProd = process.env.NODE_ENV === 'production';

const initSentry = (app) => {
  if (process.env.SENTRY_DSN) {
    // eslint-disable-next-line global-require
    const Sentry = require('@sentry/node');
    Sentry.init({ dsn: process.env.SENTRY_DSN });
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
