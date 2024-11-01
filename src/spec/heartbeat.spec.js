import * as chai from 'chai';
import chaiHttp, { request } from 'chai-http';

import server from '../app.js';

chai.should();
chai.use(chaiHttp);

describe('heartbeat', () => {
  it('should succeed', async () => {
    const res = await request.execute(server).get('/heartbeat');
    res.should.have.status(200);
    res.body.should.be.an('object');
    res.body.should.have.property('code').and.eq(200);
    res.body.should.have.property('message').and.eq('Success');
  });
});
