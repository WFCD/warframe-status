import * as chai from 'chai';
import chaiHttp from 'chai-http';

import * as utils from '../lib/utilities.js';

import { req } from './hooks/start.hook.js';

const { platforms: p, platformAliases: pa } = utils;

chai.use(chaiHttp);

const platforms = [...p, ...pa];

describe('rivens', () => {
  platforms.forEach((platform) => {
    describe(`/${platform}`, () => {
      it(`/${platform}/rivens`, async () => {
        const res = await req(`/${platform}/rivens`);
        res.should.have.status(200);
        res.should.have.property('body');
      });

      it(`/${platform}/rivens/search/:item`, async () => {
        const res = await req(`/${platform}/rivens/search/nikana`);
        res.should.have.status(200);
        res.should.have.property('body');
      });
    });
  });
});
