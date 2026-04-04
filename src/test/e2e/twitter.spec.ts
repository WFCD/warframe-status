import type { INestApplication } from '@nestjs/common';
import * as chai from 'chai';
import chaiHttp, { request } from 'chai-http';
import { getApp } from '../hooks/setup.hook';

chai.should();
chai.use(chaiHttp);

describe('twitter', () => {
  let nestApp: INestApplication;

  before(() => {
    nestApp = getApp();
  });

  describe('/', () => {
    it('should error with data off', async () => {
      // Twitter is not active by default (TWITTER_ACTIVE env var not set)
      const res = await request
        .execute(nestApp.getHttpServer())
        .get('/twitter');
      res.should.have.status(404);
      res.body.should.be.an('object');
      res.body.should.have.property('error');
      res.body.should.have.property('statusCode').and.eq(404);
    });
  });
});
