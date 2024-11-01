import * as chai from 'chai';
import chaiHttp, { request } from 'chai-http';

import server from '../app.js';

const should = chai.should();
chai.use(chaiHttp);
describe('rss', () => {
  it('works', async () => {
    if (!server.started) should.fail('server not started');
    const res = await request.execute(server).get('/rss');
    res.should.have.status(200);
    res.should.have.property('body');
  });
});
