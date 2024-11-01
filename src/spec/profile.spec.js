import * as chai from 'chai';
import chaiHttp, { request } from 'chai-http';

import server from '../app.js';

const should = chai.should();
chai.use(chaiHttp);

describe('profiles', () => {
  describe('/profile/:username', async () => {
    it('should get profile data', async () => {
      const res = await request.execute(server).get('/profile/tobiah/');
      res.should.have.status(200);
      should.exist(res.body);
      res.body.should.include.keys('accountId', 'displayName', 'masteryRank', 'created');
      res.body.displayName.should.eq('Tobiah');
    });
    it('should error with bad username', async () => {
      const res = await request.execute(server).get('/profile/asdasdaasdaasasdasdaasdaasdaasdasdaasdaasda');
      res.should.have.status(404);
      res.body.should.be.an('object').and.include.all.keys('code', 'error');
      res.body.code.should.eq(404);
      res.body.error.should.eq('No Result');
    });
  });
  describe('/profile/:username/arsenal', async () => {
    describe('should get profile data', async () => {
      it('pc [default]', async () => {
        const res = await request.execute(server).get('/profile/tobiah/arsenal');
        res.should.have.status(200);
        should.exist(res.body);
        res.body.should.include.keys('account', 'loadout');
        res.body?.account.should.include.keys('name', 'masteryRank', 'lastUpdated', 'glyph');
        res.body.account.name.should.eq('Tobiah');
      });
      it.skip('xbox', async () => {
        const res = await request.execute(server).get('/profile/MrNishi/arsenal/?platform=xb1');
        res.should.have.status(200);
        should.exist(res.body);
        res.body.should.include.keys('account', 'loadout');
        res.body?.account.should.include.keys('name', 'masteryRank', 'lastUpdated', 'glyph');
        res.body.account.name.should.eq('[DE]Megan');
      });
      it.skip('psn', async () => {
        const res = await request.execute(server).get('/profile/ErydisTheLucario/arsenal/?platform=ps4');
        res.should.have.status(200);
        should.exist(res.body);
        res.body.should.include.keys('account', 'loadout');
        res.body?.account.should.include.keys('name', 'masteryRank', 'lastUpdated', 'glyph');
        res.body.account.name.should.eq('povo844');
      });
      it('switch', async () => {
        const res = await request.execute(server).get('/profile/tobiah/arsenal/').set('platform', 'swi');
        res.should.have.status(200);
        should.exist(res.body);
        res.body.should.include.keys('account', 'loadout');
        res.body?.account.should.include.keys('name', 'masteryRank', 'lastUpdated', 'glyph');
        res.body.account.name.should.eq('Tobiah');
      });
    });
    it('should error with bad username', async () => {
      const res = await request.execute(server).get('/profile/asdasdaasdaasasdasdaasdaasdaasdasdaasdaasda/arsenal/');
      res.should.have.status(404);
      res.body.should.be.an('object').and.include.all.keys('code', 'error');
      res.body.code.should.eq(404);
      res.body.error.should.eq('No Result');
    });
  });
  describe('/profile/:username/xpInfo', async () => {
    it('should get profile xp info', async () => {
      const res = await request.execute(server).get('/profile/tobiah/xpInfo');
      res.should.have.status(200);
      should.exist(res.body);
      res.body[0].should.include.keys('uniqueName', 'xp', 'item');
    });
    it('should error with bad username', async () => {
      const res = await request.execute(server).get('/profile/asdasdaasdaasasdasdaasdaasdaasdasdaasdaasda/xpInfo');
      res.should.have.status(404);
      res.body.should.be.an('object').and.include.all.keys('code', 'error');
      res.body.code.should.eq(404);
      res.body.error.should.eq('No Result');
    });
  });
  describe('/profile/:username/xpInfo', async () => {
    it('should get profile stats', async () => {
      const res = await request.execute(server).get('/profile/tobiah/stats');
      res.should.have.status(200);
      should.exist(res.body);
      res.body.should.include.keys('guildName', 'xp', 'missionsCompleted');
    });
    it('should error with bad username', async () => {
      const res = await request.execute(server).get('/profile/asdasdaasdaasasdasdaasdaasdaasdasdaasdaasda/stats');
      res.should.have.status(404);
      res.body.should.be.an('object').and.include.all.keys('code', 'error');
      res.body.code.should.eq(404);
      res.body.error.should.eq('No Result');
    });
  });
});
