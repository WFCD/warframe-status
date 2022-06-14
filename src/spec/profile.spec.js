'use strict';

const chai = require('chai');
const chaiHttp = require('chai-http');
const server = require('../app');

const should = chai.should();
chai.use(chaiHttp);

describe('profiles', () => {
  describe('/profile/:username', async () => {
    describe('should get profile data', () => {
      it('pc [default]', async () => {
        const res = await chai.request(server).get('/profile/tobiah');
        res.should.have.status(200);
        should.exist(res.body);
        res.body.should.include.keys('account', 'loadout');
        res.body?.account.should.include.keys('name', 'masteryRank', 'lastUpdated', 'glyph');
        res.body.account.name.should.eq('Tobiah');
      });
      it('xbox', async () => {
        const res = await chai.request(server).get('/profile/[de]megan').set('platform', 'xb1');
        res.should.have.status(200);
        should.exist(res.body);
        res.body.should.include.keys('account', 'loadout');
        res.body?.account.should.include.keys('name', 'masteryRank', 'lastUpdated', 'glyph');
        res.body.account.name.should.eq('[DE]Megan');
      });
      xit('psn', async () => {
        const res = await chai.request(server).get('/profile/newyevon26').set('platform', 'ps4');
        res.should.have.status(200);
        should.exist(res.body);
        res.body.should.include.keys('account', 'loadout');
        res.body?.account.should.include.keys('name', 'masteryRank', 'lastUpdated', 'glyph');
        res.body.account.name.should.eq('povo844');
      });
      it('switch', async () => {
        const res = await chai.request(server).get('/profile/tobiah').set('platform', 'swi');
        res.should.have.status(200);
        should.exist(res.body);
        res.body.should.include.keys('account', 'loadout');
        res.body?.account.should.include.keys('name', 'masteryRank', 'lastUpdated', 'glyph');
        res.body.account.name.should.eq('Tobiah');
      });
    });
    it('should error with bad username', async () => {
      const res = await chai.request(server).get('/profile/asdasdaasdaasdaasdasdaasdaasdaasdasdaasdaasdaasdasdaasdaasdaasdasdaasdaasda');
      res.should.have.status(404);
      res.body.should.be.an('object').and.include.all.keys('code', 'error');
      res.body.code.should.eq(404);
      res.body.error.should.eq('No Result');
    });
  });
});
