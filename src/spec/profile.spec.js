import chai from 'chai';
import chaiHttp from 'chai-http';

import server from '../app.js';

const should = chai.should();
chai.use(chaiHttp);

describe('profiles', () => {
  describe('/profile/:username', async () => {
    it('should get profile data', async () => {
      const res = await chai.request(server).get('/profile/tobiah/');
      res.should.have.status(200);
      should.exist(res.body);
      res.body.should.include.keys('profile', 'stats');
      res.body?.profile.should.include.keys('accountId', 'displayName', 'masteryRank', 'created');
      res.body.profile.displayName.should.eq('Tobiah');
    });

    it('should error with bad username', async () => {
      const res = await chai.request(server).get('/profile/asdasdaasdaasasdasdaasdaasdaasdasdaasdaasda');
      res.should.have.status(404);
      res.body.should.be.an('object').and.include.all.keys('code', 'error');
      res.body.code.should.eq(404);
      res.body.error.should.eq('No Result');
    });
  });
});
