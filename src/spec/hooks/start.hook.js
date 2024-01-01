import chai from 'chai';
import chaiHttp from 'chai-http';
import app from '../../app.js';
import Settings from '../../lib/settings.js';

const { port, host } = Settings;

chai.use(chaiHttp);
app.listen(port, host, () => {
  setTimeout(() => {
    app.emit('started');
    app.started = true;
  }, 10000);
});
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
