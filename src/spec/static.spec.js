'use strict';

const chai = require('chai');
const chaiHttp = require('chai-http');
const { warframeData } = require('../lib/utilities');
const server = require('../app');

const should = chai.should();
chai.use(chaiHttp);
const dataKeys = Object.keys(warframeData);

describe('static data', () => {
  dataKeys.forEach((key) => {
    it(`should provide ${key} data`, async () => {
      const res = await chai.request(server).get(`/${key}`);
      res.should.have.status(200);
      should.exist(res.body);
    });
    it(`should provide searchability for ${key} data`, async () => {
      const res = await chai.request(server).get(`/${key}/search/a`);
      res.should.have.status(200);
      should.exist(res.body);
    });
  });
});
