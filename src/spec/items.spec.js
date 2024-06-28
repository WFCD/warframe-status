import chai from 'chai';
import chaiHttp from 'chai-http';

import server from '../app.js';
import { Items } from '../lib/utilities.js';

const should = chai.should();
chai.use(chaiHttp);

describe('items', () => {
  it('should return all items', async () => {
    const res = await chai.request(server).get('/items');
    res.should.have.status(200);
    res.body.should.be.an('array');
    res.body.length.should.be.equal(new Items().length);
  });
  it('should include required keys', async () => {
    const res = await chai.request(server).get('/items');
    res.should.have.status(200);
    res.body.should.be.an('array');
    res.body.length.should.be.greaterThan(0);
    res.body.forEach((item) => {
      item.should.include.all.keys('uniqueName', 'name', 'category', 'type', 'tradable');
    });
  });
  it('should remove keys from dump', async () => {
    const res = await chai.request(server).get('/items?remove=uniqueName,description');
    res.should.have.status(200);
    res.body.should.be.an('array');
    res.body.length.should.be.greaterThan(0);
    res.body[0].should.not.have.property('uniqueName');
    res.body[0].should.not.have.property('description');
  });
  it('should filter with desired key:value pairs', async () => {
    const res = await chai
      .request(server)
      .get('/items?only=name,category,introduced&filter=category:Warframes,introduced.name:Vanilla');
    res.should.have.status(200);
    res.body.should.be.an('array');
    res.body.length.should.be.eq(8);
    res.body.forEach((item) => {
      item.should.have.property('name');
      item.should.have.property('category', 'Warframes');
      item.should.have.property('introduced');
      item.introduced.name.should.eq('Vanilla');
    });
  });
  it('should only include desired keys from dump', async () => {
    const res = await chai.request(server).get('/items?only=uniqueName,description');
    res.should.have.status(200);
    res.body.should.be.an('array');
    res.body.length.should.be.greaterThan(0);
    res.body[0].should.have.property('uniqueName');
    res.body[0].should.have.property('description');
    res.body[0].should.not.have.property('name');
  });
  it('should be case insensitive', async () => {
    const res = await chai.request(server).get('/items/excalibur%20umbra');
    res.should.have.status(200);
    res.body.should.be.an('object');
    res.body.name.should.be.equal('Excalibur Umbra');
  });
  it('should be searchable for a single result', async () => {
    const res = await chai.request(server).get('/items/excalibur%20umbra');
    res.should.have.status(200);
    res.body.should.be.an('object');
    Object.keys(res.body).length.should.be.greaterThan(0);
  });
  it('should gives error when not found', async () => {
    const res = await chai.request(server).get('/items/excalibur%20poopoo');
    res.should.have.status(404);
    res.body.should.be.an('object');
    res.body.error.should.eq('No Result');
    res.body.code.should.eq(404);
  });
  it('should be searchable for multiple results', async () => {
    const res = await chai.request(server).get('/items/search/excalibur%20umbra');
    res.should.have.status(200);
    res.body.should.be.an('array');
    res.body.length.should.be.greaterThan(1);
    res.body[0].name.should.eq('Excalibur Umbra');
  });
  it('should accommodate alternate languages', async () => {
    let res = await chai.request(server).get('/items/search/excalibur%20umbra').set('Accept-Language', 'zh');
    res.should.have.status(200);
    res.body.should.be.an('array');
    res.body.length.should.be.greaterThan(1);
    should.not.exist(res.body[0].i18n);
    res.body[0].name.should.eq('Excalibur Umbra');
    res.body[0].description.should.include('来自');
    res.should.have.header('Content-Language', 'zh');

    res = await chai.request(server).get('/items/search/excalibur%20umbra?language=zh&only=name,description');
    res.should.have.status(200);
    res.body.should.be.an('array');
    res.body.length.should.be.greaterThan(1);
    should.not.exist(res.body[0].i18n);
    res.body[0].name.should.eq('Excalibur Umbra');
    res.body[0].description.should.include('来自');
    res.should.have.header('Content-Language', 'zh');

    res = await chai.request(server).get('/items/search/excalibur%20umbra').set('Accept-Language', 'it');
    res.should.have.status(200);
    res.body.should.be.an('array');
    res.body.length.should.be.greaterThan(1);
    should.not.exist(res.body[0].i18n);
    res.body[0].name.should.eq('Excalibur Umbra');
    res.body[0].description.should.include("Dall'ombra");
    res.should.have.header('Content-Language', 'it');

    res = await chai.request(server).get('/items/search/excalibur%20umbra?language=it&only=name,description');
    res.should.have.status(200);
    res.body.should.be.an('array');
    res.body.length.should.be.greaterThan(1);
    should.not.exist(res.body[0].i18n);
    res.body[0].name.should.eq('Excalibur Umbra');
    res.body[0].description.should.include("Dall'ombra");
    res.should.have.header('Content-Language', 'it');
  });
  it('should return empty array for unmatchable', async () => {
    let res = await chai.request(server).get('/items/search/my%20name%20is%20inigo%20montonya');
    res.should.have.status(200);
    res.body.should.be.an('array');
    res.body.length.should.eq(0);

    res = await chai.request(server).get('/items/search/excalibur?by=shoobedowopwah');
    res.should.have.status(200);
    res.body.should.be.an('array');
    res.body.length.should.eq(0);
  });
  it('should return an item by a non-default key', async () => {
    const res = await chai.request(server).get('/items/bronco.png?by=imageName');
    res.should.have.status(200);
    res.body.should.be.an('object');
    Object.keys(res.body).length.should.be.greaterThan(0);
  });
  it('should return multiple items by a non-default key', async () => {
    const res = await chai.request(server).get('/items/search/bronco.png?by=imageName');
    res.should.have.status(200);
    res.body.should.be.an('array');
    res.body.length.should.be.greaterThan(0);
  });
  it('should return an item by nested keys', async () => {
    const res = await chai.request(server).get('/items/7?by=attacks.falloff.start');
    res.should.have.status(200);
    res.body.should.be.an('object');
    Object.keys(res.body).length.should.be.greaterThan(0);
    res.body.uniqueName.should.eq('/Lotus/Weapons/Tenno/Pistol/HandShotGun');
  });
  it('should give error for unmatchable nested keys', async () => {
    let res = await chai.request(server).get('/items/bronco?by=components.shoobedowopwah');
    res.should.have.status(404);
    res.body.should.be.an('object');
    res.body.error.should.eq('No Result');
    res.body.code.should.eq(404);

    res = await chai.request(server).get('/items/rare?by=components.rarity');
    res.should.have.status(404);
    res.body.should.be.an('object');
    res.body.error.should.eq('No Result');
    res.body.code.should.eq(404);
  });
  it('should return multiple items by nested keys', async () => {
    const res = await chai.request(server).get('/items/search/7?by=attacks.falloff.start');
    res.should.have.status(200);
    res.body.should.be.an('array');
    res.body.length.should.eq(2);
    res.body[0].uniqueName.should.eq('/Lotus/Weapons/Tenno/Akimbo/AkimboShotGun');
    res.body[1].uniqueName.should.eq('/Lotus/Weapons/Tenno/Pistol/HandShotGun');
  });
  it('should return empty array for unmatchable nested keys', async () => {
    let res = await chai.request(server).get('/items/search/bronco?by=components.shoobedowopwah');
    res.should.have.status(200);
    res.body.should.be.an('array');
    res.body.length.should.eq(0);

    res = await chai.request(server).get('/items/search/rare?by=components.rarity');
    res.should.have.status(200);
    res.body.should.be.an('array');
    res.body.length.should.eq(0);
  });
});

describe('weapons', () => {
  it('should return all weapons', async () => {
    const res = await chai.request(server).get('/weapons');
    res.should.have.status(200);
    res.body.should.be.an('array');
    res.body.length.should.be.greaterThanOrEqual(0);
  });
  it('should remove keys from dump', async () => {
    const res = await chai.request(server).get('/weapons?remove=uniqueName,description');
    res.should.have.status(200);
    res.body.should.be.an('array');
    res.body.length.should.be.greaterThan(0);
    res.body[0].should.not.have.property('uniqueName');
    res.body[0].should.not.have.property('description');
  });
  it('should only include desired keys from dump', async () => {
    const res = await chai.request(server).get('/weapons?only=uniqueName,description');
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
    const res = await chai.request(server).get(`/warframes?ts=${Date.now()}`);
    res.should.have.status(200);
    res.body.should.be.an('array');
    res.body.length.should.be.greaterThan(0);
  });
  it('should remove keys from dump', async () => {
    const res = await chai.request(server).get(`/warframes?remove=uniqueName,description&ts=${Date.now()}`);
    res.should.have.status(200);
    res.body.should.be.an('array');
    res.body.length.should.be.greaterThan(0);
    res.body[0].should.not.have.property('uniqueName');
    res.body[0].should.not.have.property('description');
  });
  it('should only include desired keys from dump', async () => {
    const res = await chai.request(server).get(`/warframes?only=uniqueName,description&ts=${Date.now()}`);
    res.should.have.status(200);
    res.body.should.be.an('array');
    res.body.length.should.be.greaterThan(0);
    res.body[0].should.have.property('uniqueName');
    res.body[0].should.have.property('description');
    res.body[0].should.not.have.property('name');
  });
  it('should be searchable for a single result', async () => {
    const res = await chai.request(server).get(`/warframes/excalibur%20umbra?ts=${Date.now()}`);
    res.should.have.status(200);
    res.body.should.be.an('object');
    Object.keys(res.body).length.should.be.greaterThan(0);
  });
  it('should be searchable for multiple results', async () => {
    const res = await chai.request(server).get('/warframes/search/excalibur%20umbra');
    res.should.have.status(200);
    res.body.should.be.an('array');
    res.body.length.should.eq(1);
    res.body[0].name.should.eq('Excalibur Umbra');
  });
});

describe('mods', () => {
  it('should resolve the most exact match', async () => {
    const res = await chai.request(server).get('/mods/rush?only=name');
    res.should.have.status(200);
    res.body.should.be.an('object');
    res.body.should.not.have.property('uniqueName');
    res.body.should.not.have.property('description');
    res.body.should.have.property('name');
    res.body.name.should.eq('Rush');
  });
  it('should resolve only desired language', async () => {
    const res = await chai.request(server).get('/mods?only=name').set('Accept-Language', 'zh');
    res.should.have.status(200);
    res.body.should.be.an('array');
  });
});
