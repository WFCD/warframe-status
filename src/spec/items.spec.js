'use strict';

const chai = require('chai');
const chaiHttp = require('chai-http');
const server = require('../app');

chai.should();
chai.use(chaiHttp);

describe('items', () => {
  it('should return all items', async () => {
    const res = await chai.request(server)
      .get('/items');
    res.should.have.status(200);
    res.body.should.be.an('array');
    res.body.length.should.be.greaterThan(0);
  });
  it('should include required keys', async () => {
    const res = await chai.request(server)
      .get('/items');
    res.should.have.status(200);
    res.body.should.be.an('array');
    res.body.length.should.be.greaterThan(0);
    res.body.forEach((item) => {
      item.should.include.all.keys('uniqueName', 'name', 'category', 'type', 'tradable');
    });
  });
  it('should remove keys from dump', async () => {
    const res = await chai.request(server)
      .get('/items?remove=uniqueName,description');
    res.should.have.status(200);
    res.body.should.be.an('array');
    res.body.length.should.be.greaterThan(0);
    res.body[0].should.not.have.property('uniqueName');
    res.body[0].should.not.have.property('description');
  });
  it('should only include desired keys from dump', async () => {
    const res = await chai.request(server)
      .get('/items?only=uniqueName,description');
    res.should.have.status(200);
    res.body.should.be.an('array');
    res.body.length.should.be.greaterThan(0);
    res.body[0].should.have.property('uniqueName');
    res.body[0].should.have.property('description');
    res.body[0].should.not.have.property('name');
  });
  it('should be case insensitive', async () => {
    const res = await chai.request(server)
      .get('/items/excalibur%20umbra');
    res.should.have.status(200);
    res.body.should.be.an('object');
    res.body.name.should.be.equal('Excalibur Umbra');
  });
  it('should be searchable for a single result', async () => {
    const res = await chai.request(server)
      .get('/items/excalibur%20umbra');
    res.should.have.status(200);
    res.body.should.be.an('object');
    Object.keys(res.body).length.should.be.greaterThan(0);
  });
  it('should gives error when not found', async () => {
    const res = await chai.request(server)
      .get('/items/excalibur%20poopoo');
    res.should.have.status(404);
    res.body.should.be.an('object');
    res.body.error.should.eq('No Result');
    res.body.code.should.eq(404);
  });
  it('should be searchable for multiple results', async () => {
    const res = await chai.request(server)
      .get('/items/search/excalibur%20umbra');
    res.should.have.status(200);
    res.body.should.be.an('array');
    res.body.length.should.be.greaterThan(1);
    res.body[0].name.should.eq('Excalibur Umbra');
  });
  it('should accommodate alternate languages', async () => {
    const res = await chai.request(server)
      .get('/items/search/excalibur%20umbra')
      .set('Accept-Language', 'zh');
    res.should.have.status(200);
    res.body.should.be.an('array');
    res.body.length.should.be.greaterThan(1);
    res.body[0].name.should.eq('Excalibur Umbra');
    res.should.have.header('Content-Language', 'zh');
  });
});

describe('weapons', () => {
  it('should return all weapons', async () => {
    const res = await chai.request(server)
      .get('/weapons');
    res.should.have.status(200);
    res.body.should.be.an('array');
    res.body.length.should.be.greaterThanOrEqual(0);
  });
  it('should remove keys from dump', async () => {
    const res = await chai.request(server)
      .get('/weapons?remove=uniqueName,description');
    res.should.have.status(200);
    res.body.should.be.an('array');
    res.body.length.should.be.greaterThan(0);
    res.body[0].should.not.have.property('uniqueName');
    res.body[0].should.not.have.property('description');
  });
  it('should only include desired keys from dump', async () => {
    const res = await chai.request(server)
      .get('/weapons?only=uniqueName,description');
    res.should.have.status(200);
    res.body.should.be.an('array');
    res.body.length.should.be.greaterThan(0);
    res.body[0].should.have.property('uniqueName');
    res.body[0].should.have.property('description');
    res.body[0].should.not.have.property('name');
  });
});

describe('warframes', () => {
  it('should return all warframes', async () => {
    const res = await chai.request(server)
      .get(`/warframes?ts=${Date.now()}`);
    res.should.have.status(200);
    res.body.should.be.an('array');
    res.body.length.should.be.greaterThan(0);
  });
  it('should remove keys from dump', async () => {
    const res = await chai.request(server)
      .get(`/warframes?remove=uniqueName,description&ts=${Date.now()}`);
    res.should.have.status(200);
    res.body.should.be.an('array');
    res.body.length.should.be.greaterThan(0);
    res.body[0].should.not.have.property('uniqueName');
    res.body[0].should.not.have.property('description');
  });
  it('should only include desired keys from dump', async () => {
    const res = await chai.request(server)
      .get(`/warframes?only=uniqueName,description&ts=${Date.now()}`);
    res.should.have.status(200);
    res.body.should.be.an('array');
    res.body.length.should.be.greaterThan(0);
    res.body[0].should.have.property('uniqueName');
    res.body[0].should.have.property('description');
    res.body[0].should.not.have.property('name');
  });
  it('should be searchable for a single result', async () => {
    const res = await chai.request(server)
      .get(`/warframes/excalibur%20umbra?ts=${Date.now()}`);
    res.should.have.status(200);
    res.body.should.be.an('object');
    Object.keys(res.body).length.should.be.greaterThan(0);
  });
  it('should be searchable for multiple results', async () => {
    const res = await chai.request(server)
      .get(`/warframes/search/excalibur%20umbra?ts=${Date.now()}`);
    res.should.have.status(200);
    res.body.should.be.an('array');
    res.body.length.should.eq(1);
    res.body[0].name.should.eq('Excalibur Umbra');
  });
});

describe('mods', () => {
  it('should resolve the most exact match', async () => {
    const res = await chai.request(server)
      .get('/mods/rush?only=name');
    res.should.have.status(200);
    res.body.should.be.an('object');
    res.body.should.not.have.property('uniqueName');
    res.body.should.not.have.property('description');
    res.body.should.have.property('name');
    res.body.name.should.eq('Rush');
  });
  it('should resolve only desired language', async () => {
    const res = await chai.request(server)
      .get('/mods?only=name')
      .set('Accept-Language', 'zh');
    res.should.have.status(200);
    res.body.should.be.an('array');
  });
});
