import type { INestApplication } from '@nestjs/common';
import * as chai from 'chai';
import chaiHttp, { request } from 'chai-http';
import { getApp } from '../hooks/setup.hook';

chai.should();
chai.use(chaiHttp);

describe('heartbeat', () => {
  let nestApp: INestApplication;

  before(() => {
    nestApp = getApp();
  });

  it('should succeed', async () => {
    const res = await request
      .execute(nestApp.getHttpServer())
      .get('/heartbeat');
    res.should.have.status(200);
    res.body.should.be.an('object');
    res.body.should.have.property('code').and.eq(200);
    res.body.should.have.property('message').and.eq('Success');
  });
});
