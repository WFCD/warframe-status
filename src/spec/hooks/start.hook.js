'use strict';

// eslint-disable-next-line import/no-extraneous-dependencies
const chai = require('chai');
// eslint-disable-next-line import/no-extraneous-dependencies
const chaiHttp = require('chai-http');
const app = require('../../app');
const { port, host } = require('../../lib/settings');

chai.use(chaiHttp);
app.listen(port, host, () => {
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
