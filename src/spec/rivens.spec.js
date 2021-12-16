'use strict';

const chai = require('chai');
const chaiHttp = require('chai-http');
const server = require('../app');
const { platforms: p, platformAliases: pa } = require('../lib/utilities');

const should = chai.should();
chai.use(chaiHttp);

const platforms = [...p, ...pa];

describe('rivens', () => {
  platforms.forEach((platform) => {
    describe(`/${platform}`, () => {
      it(`/${platform}/rivens`, async () => {
        if (!server.started) should.fail('server not started');
        const res = await chai.request(server)
          .get(`/${platform}/rivens`);
        res.should.have.status(200);
        res.should.have.property('body');
      });

      it(`/${platform}/rivens/search/:item`, async () => {
        if (!server.started) should.fail('server not started');
        const res = await chai.request(server)
          .get(`/${platform}/rivens/search/nikana`);
        res.should.have.status(200);
        res.should.have.property('body');
      });
    });
  });
});
