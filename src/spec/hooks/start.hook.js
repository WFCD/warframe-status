import * as chai from 'chai';
import chaiHttp, { request } from 'chai-http';

import app from '../../app.js';
import { port, host } from '../../lib/settings.js';

chai.use(chaiHttp);
app.listen(port, host, () => {
  setTimeout(() => {
    app.emit('started');
    app.started = true;
  }, 10000);
});

// this specific named export is required
// eslint-disable-next-line import/prefer-default-export
export const mochaHooks = {
  beforeAll(done) {
    this.timeout = 60000;
    if (!app.started) {
      app.on('started', done);
    } else {
      done();
    }
  },
};

export const req = (path) => request.execute(app).get(path);
