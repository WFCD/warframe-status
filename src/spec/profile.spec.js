import * as chai from 'chai';
import chaiHttp from 'chai-http';

import { req } from './hooks/start.hook.js';

const should = chai.should();
chai.use(chaiHttp);

describe('profiles', () => {
  describe('/profile/:username', async () => {
    it('should get profile data', async () => {
      const res = req('/profile/tobiah/');
      res.should.have.status(200);
      should.exist(res.body);
      res.body.should.include.keys('accountId', 'displayName', 'masteryRank', 'created');
      res.body.displayName.should.eq('Tobiah');
    });
    it('should error with bad username', async () => {
      const res = req('/profile/asdasdaasdaasasdasdaasdaasdaasdasdaasdaasda');
      res.should.have.status(404);
      res.body.should.be.an('object').and.include.all.keys('code', 'error');
      res.body.code.should.eq(404);
      res.body.error.should.eq('No Result');
    });
  });
  describe('/profile/:username/arsenal', async () => {
    describe('should get profile data', async () => {
      it('pc [default]', async () => {
        const res = req('/profile/tobiah/arsenal');
        res.should.have.status(200);
        should.exist(res.body);
        res.body.should.include.keys('account', 'loadout');
        res.body?.account.should.include.keys('name', 'masteryRank', 'lastUpdated', 'glyph');
        res.body.account.name.should.eq('Tobiah');
      });
      it.skip('xbox', async () => {
        const res = req('/profile/MrNishi/arsenal/?platform=xb1');
        res.should.have.status(200);
        should.exist(res.body);
        res.body.should.include.keys('account', 'loadout');
        res.body?.account.should.include.keys('name', 'masteryRank', 'lastUpdated', 'glyph');
        res.body.account.name.should.eq('[DE]Megan');
      });
      it.skip('psn', async () => {
        const res = req('/profile/ErydisTheLucario/arsenal/?platform=ps4');
        res.should.have.status(200);
        should.exist(res.body);
        res.body.should.include.keys('account', 'loadout');
        res.body?.account.should.include.keys('name', 'masteryRank', 'lastUpdated', 'glyph');
        res.body.account.name.should.eq('povo844');
      });
      it('switch', async () => {
        const res = req('/profile/tobiah/arsenal/').set('platform', 'swi');
        res.should.have.status(200);
        should.exist(res.body);
        res.body.should.include.keys('account', 'loadout');
        res.body?.account.should.include.keys('name', 'masteryRank', 'lastUpdated', 'glyph');
        res.body.account.name.should.eq('Tobiah');
      });
    });
    it('should error with bad username', async () => {
      const res = req('/profile/asdasdaasdaasasdasdaasdaasdaasdasdaasdaasda/arsenal/');
      res.should.have.status(404);
      res.body.should.be.an('object').and.include.all.keys('code', 'error');
      res.body.code.should.eq(404);
      res.body.error.should.eq('No Result');
    });
  });
  describe('/profile/:username/xpInfo', async () => {
    it('should get profile xp info', async () => {
      const res = req('/profile/tobiah/xpInfo');
      res.should.have.status(200);
      should.exist(res.body);
      res.body[0].should.include.keys('uniqueName', 'xp', 'item');
    });
    it('should error with bad username', async () => {
      const res = req('/profile/asdasdaasdaasasdasdaasdaasdaasdasdaasdaasda/xpInfo');
      res.should.have.status(404);
      res.body.should.be.an('object').and.include.all.keys('code', 'error');
      res.body.code.should.eq(404);
      res.body.error.should.eq('No Result');
    });
  });
  describe('/profile/:username/xpInfo', async () => {
    it('should get profile stats', async () => {
      const res = req('/profile/tobiah/stats');
      res.should.have.status(200);
      should.exist(res.body);
      res.body.should.include.keys('guildName', 'xp', 'missionsCompleted');
    });
    it('should error with bad username', async () => {
      const res = req('/profile/asdasdaasdaasasdasdaasdaasdaasdasdaasdaasda/stats');
      res.should.have.status(404);
      res.body.should.be.an('object').and.include.all.keys('code', 'error');
      res.body.code.should.eq(404);
      res.body.error.should.eq('No Result');
    });
  });
});
