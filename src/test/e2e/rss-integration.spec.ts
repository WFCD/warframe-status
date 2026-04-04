import type { INestApplication } from '@nestjs/common';
import * as chai from 'chai';
import chaiHttp, { request } from 'chai-http';
import { getApp } from '../hooks/setup.hook';

chai.should();
chai.use(chaiHttp);

const USE_WORLDSTATE = process.env.USE_WORLDSTATE === 'true';

describe('rss', () => {
  let nestApp: INestApplication;

  before(function () {
    if (!USE_WORLDSTATE) {
      this.skip();
    }
    nestApp = getApp();
  });

  it('works', async () => {
    const res = await request.execute(nestApp.getHttpServer()).get('/rss');
    res.should.have.status(200);
    res.should.have.property('body');
  });
});
