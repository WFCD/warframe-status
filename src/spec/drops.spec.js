'use strict';

const chai = require('chai');
const chaiHttp = require('chai-http');
const server = require('../app');

chai.should();
chai.use(chaiHttp);

describe('drops', () => {
  it('should be an array', async () => {
    const res = await chai.request(server)
      .get('/drops');
    res.should.have.status(200);
    res.body.should.be.an('array');
    res.body.length.should.be.greaterThan(0);
  });
  describe('search', () => {
    it('should look up forma', async () => {
      const res = await chai.request(server).get('/drops/search/forma');
      res.should.have.status(200);
      res.body.should.be.an('array');
      res.body.length.should.be.greaterThan(0);
    });
    it('should group by location', async () => {
      const res = await chai.request(server).get('/drops/search/forma?grouped_by=location');
      res.should.have.status(200);
      res.body.should.be.an('Object');
      Object.keys(res.body).length.should.be.greaterThan(0);
    });
    it('should respond with an empty object for no results ', async () => {
      const res = await chai.request(server).get('/drops/search/lephantisxda?grouped_by=location');
      res.should.have.status(200);
      res.body.should.be.an('Object');
      Object.keys(res.body).length.should.eq(0);
    });
  });
});
