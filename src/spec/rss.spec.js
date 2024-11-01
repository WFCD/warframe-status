import * as chai from 'chai';
import chaiHttp from 'chai-http';

import server from '../app.js';

import { req } from './hooks/start.hook.js';

const should = chai.should();
chai.use(chaiHttp);
describe('rss', () => {
  it('works', async () => {
    if (!server.started) should.fail('server not started');
    const res = req('/rss');
    res.should.have.status(200);
    res.should.have.property('body');
  });
});
