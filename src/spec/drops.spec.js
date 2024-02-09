import chai from 'chai';
import chaiHttp from 'chai-http';

import server from '../app.js';

chai.should();
chai.use(chaiHttp);

describe('drops', () => {
  it('should be an array', async () => {
    const res = await chai.request(server).get('/drops');
    res.should.have.status(200);
    res.body.should.be.an('array');
    res.body.length.should.be.greaterThan(0);
  });
  describe('search', () => {
    describe('by item', () => {
      it('should look up forma', async () => {
        const res = await chai.request(server).get('/drops/search/Forma');
        res.should.have.status(200);
        res.body.should.be.an('array');
        res.body.length.should.be.greaterThan(0);
      });
      it('should be inclusive', async () => {
        const res = await chai.request(server).get('/drops/search/Form');
        res.should.have.status(200);
        res.body.should.be.an('array');
        res.body.length.should.be.greaterThan(0);
        res.body.map(({ item }) => item).should.include('Forma');
      });
      it('should be case insensitive', async () => {
        const res = await chai.request(server).get('/drops/search/forma');
        res.should.have.status(200);
        res.body.should.be.an('array');
        res.body.length.should.be.greaterThan(0);
        res.body.map(({ item }) => item).should.include('Forma');
      });
    });
    describe('by place', () => {
      it('should look up hydron', async () => {
        const res = await chai.request(server).get('/drops/search/Sedna%2FHydron (Defense), Rot A');
        res.should.have.status(200);
        res.body.should.be.an('array');
        res.body.length.should.be.greaterThan(0);
      });
      it('should be inclusive', async () => {
        const res = await chai.request(server).get('/drops/search/Hydron');
        res.should.have.status(200);
        res.body.should.be.an('array');
        res.body.length.should.be.greaterThan(0);
        res.body.map(({ place }) => place).should.include('Sedna/Hydron (Defense), Rot A');
      });
      it('should be case insensitive', async () => {
        const res = await chai.request(server).get('/drops/search/sedna%2Fhydron (defense)');
        res.should.have.status(200);
        res.body.should.be.an('array');
        res.body.length.should.be.greaterThan(0);
        res.body.map(({ place }) => place).should.include('Sedna/Hydron (Defense), Rot A');
      });
    });
    it('should search by item and place', async () => {
      const res = await chai.request(server).get('/drops/search/Hydron,Forma');
      res.should.have.status(200);
      res.body.should.be.an('array');
      res.body.length.should.be.greaterThan(0);
      res.body.map(({ place }) => place).should.include('Sedna/Hydron (Defense), Rot A');
      res.body.map(({ item }) => item).should.include('Forma');
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
