'use strict';

// eslint-disable-next-line import/no-extraneous-dependencies
const chai = require('chai');
// eslint-disable-next-line import/no-extraneous-dependencies
const chaiHttp = require('chai-http');
const app = require('../../app');

chai.use(chaiHttp);
app.listen(process.env.PORT || 3000, process.env.IP || process.env.HOST || '0.0.0.0', () => {
  setTimeout(() => {
    app.emit('started');
    app.started = true;
  }, 10000);
});
module.exports.mochaHooks = {
  beforeAll(done) {
    this.timeout = 60000;
    if (!app.started) {
      app.on('started', done);
    } else {
      done();
    }
  },
};
