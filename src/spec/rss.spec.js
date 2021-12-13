'use strict';

const chai = require('chai');
const chaiHttp = require('chai-http');
const server = require('../app');

const should = chai.should();
chai.use(chaiHttp);
describe('rss', () => {
  it('works', async () => {
    if (!server.started) should.fail('server not started');
    const res = await chai.request(server)
      .get('/rss');
    res.should.have.status(200);
    res.should.have.property('body');
  });
});
