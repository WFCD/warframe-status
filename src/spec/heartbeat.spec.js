import * as chai from 'chai';
import chaiHttp from 'chai-http';

import { req } from './hooks/start.hook.js';

chai.should();
chai.use(chaiHttp);

describe('heartbeat', () => {
  it('should succeed', async () => {
    const res = await req('/heartbeat');
    res.should.have.status(200);
    res.body.should.be.an('object');
    res.body.should.have.property('code').and.eq(200);
    res.body.should.have.property('message').and.eq('Success');
  });
});
