import type { INestApplication } from '@nestjs/common';
import * as chai from 'chai';
import chaiHttp, { request } from 'chai-http';
import { getApp } from '../hooks/setup.hook';

chai.should();
chai.use(chaiHttp);

const platforms = ['pc', 'ps4', 'xb1', 'swi', 'ns'];

describe('rivens', () => {
  let nestApp: INestApplication;

  before(() => {
    nestApp = getApp();
  });

  platforms.forEach((platform) => {
    describe(`/${platform}`, () => {
      it(`/${platform}/rivens`, async () => {
        const res = await request
          .execute(nestApp.getHttpServer())
          .get(`/${platform}/rivens`);
        res.should.have.status(200);
        res.should.have.property('body');
      });

      it(`/${platform}/rivens/search/:item`, async () => {
        const res = await request
          .execute(nestApp.getHttpServer())
          .get(`/${platform}/rivens/search/nikana`);
        res.should.have.status(200);
        res.should.have.property('body');
      });
    });
  });
});
