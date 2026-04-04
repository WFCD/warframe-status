import * as chai from 'chai';
import chaiHttp from 'chai-http';

import { req } from '../hooks/setup.hook';

const should = chai.should();
chai.use(chaiHttp);

// Tests are skipped because they require external API calls that may fail
// This matches the Express test behavior (describe.skip in profile.spec.js)
describe.skip('profiles', () => {
  describe('/profile/:username', () => {
    it('should get profile data', async () => {
      const res = await req('/profile/tobiah/');
      res.should.have.status(200);
      should.exist(res.body);
      res.body.should.include.keys(
        'accountId',
        'displayName',
        'masteryRank',
        'created',
      );
      res.body.displayName.should.eq('Tobiah');
    });

    it('should error with bad username', async () => {
      const res = await req(
        '/profile/asdasdaasdaasasdasdaasdaasdaasdasdaasdaasda',
      );
      res.should.have.status(404);
      res.body.should.be.an('object').and.include.all.keys('code', 'error');
      res.body.code.should.eq(404);
      res.body.error.should.eq('No Result');
    });
  });

  describe('/profile/:username/arsenal', () => {
    it('pc [default]', async () => {
      const res = await req('/profile/tobiah/arsenal');
      res.should.have.status(200);
      should.exist(res.body);
      res.body.should.include.keys('account', 'loadout');
      res.body?.account.should.include.keys(
        'name',
        'masteryRank',
        'lastUpdated',
        'glyph',
      );
      res.body.account.name.should.eq('Tobiah');
    });

    it('should error with bad username', async () => {
      const res = await req(
        '/profile/asdasdaasdaasasdasdaasdaasdaasdasdaasdaasda/arsenal/',
      );
      res.should.have.status(404);
      res.body.should.be.an('object').and.include.all.keys('code', 'error');
      res.body.code.should.eq(404);
      res.body.error.should.eq('No Result');
    });
  });

  describe('/profile/:username/xpInfo', () => {
    it('should get profile xp info without item', async () => {
      const res = await req('/profile/tobiah/xpInfo');
      res.should.have.status(200);
      should.exist(res.body);
      res.body[0].should.include.keys('uniqueName', 'xp');
      res.body[0].should.not.property('item');
    });

    it('should error with bad username', async () => {
      const res = await req(
        '/profile/asdasdaasdaasasdasdaasdaasdaasdasdaasdaasda/xpInfo',
      );
      res.should.have.status(404);
      res.body.should.be.an('object').and.include.all.keys('code', 'error');
      res.body.code.should.eq(404);
      res.body.error.should.eq('No Result');
    });
  });

  describe('/profile/:username/stats', () => {
    it('should get profile stats', async () => {
      const res = await req('/profile/tobiah/stats');
      res.should.have.status(200);
      should.exist(res.body);
      res.body.should.include.keys('guildName', 'xp', 'missionsCompleted');
    });

    it('should error with bad username', async () => {
      const res = await req(
        '/profile/asdasdaasdaasasdasdaasdaasdaasdasdaasdaasda/stats',
      );
      res.should.have.status(404);
      res.body.should.be.an('object').and.include.all.keys('code', 'error');
      res.body.code.should.eq(404);
      res.body.error.should.eq('No Result');
    });
  });
});
