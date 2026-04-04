import type { INestApplication } from '@nestjs/common';
import * as chai from 'chai';
import chaiHttp, { request } from 'chai-http';
import { getApp } from '../hooks/setup.hook';

chai.should();
chai.use(chaiHttp);

const USE_WORLDSTATE = process.env.USE_WORLDSTATE === 'true';

describe('worldstate', () => {
  let nestApp: INestApplication;

  before(function () {
    if (!USE_WORLDSTATE) {
      this.skip();
    }
    nestApp = getApp();
  });

  it('should 404 on invalid worldstate keys', async () => {
    // purposeful typo - 'deepArchimedia' is not a valid field
    const res = await request
      .execute(nestApp.getHttpServer())
      .get('/pc/deepArchimedia');
    res.should.have.status(404);
  });

  describe('/pc', () => {
    it('should succeed', async () => {
      const res = await request.execute(nestApp.getHttpServer()).get('/pc');
      res.should.have.status(200);
      res.should.have.property('body');
      res.body.should.be.an('object');
      res.body.should.have.property('timestamp');
      res.body.timestamp.should.be.a('string');
    });

    it('should get alerts', async () => {
      const res = await request
        .execute(nestApp.getHttpServer())
        .get('/pc/alerts');
      res.should.have.status(200);
      res.should.have.property('body');
    });

    it('should get invasions', async () => {
      const res = await request
        .execute(nestApp.getHttpServer())
        .get('/pc/invasions');
      res.should.have.status(200);
      res.should.have.property('body');
    });
  });
});
