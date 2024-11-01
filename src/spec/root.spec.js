import * as chai from 'chai';
import chaiHttp, { request } from 'chai-http';

import server from '../app.js';

chai.should();
chai.use(chaiHttp);

describe('root (/)', () => {
  it('should succeed', async () => {
    const res = await request.execute(server).get('/');
    res.should.have.status(200);
    res.body.should.be.an('object');
    res.body.should.have.property('code').and.eq(200);
    res.body.should.have.property('message').and.eq('OK');
  });
});

describe('404', () => {
  it('should produce a Not Found error', async () => {
    const res = await request.execute(server).get('/foo');
    res.should.have.status(404);
    res.body.should.be.an('object');
    res.body.should.have.property('code').and.eq(404);
    res.body.should.have.property('error').and.eq('No such route.');
  });
});
