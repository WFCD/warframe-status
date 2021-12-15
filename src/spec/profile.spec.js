'use strict';

const chai = require('chai');
const chaiHttp = require('chai-http');
const server = require('../app');

const should = chai.should();
chai.use(chaiHttp);

let proceed = false;
describe('profiles', () => {
  before(async () => {
    proceed = !!((await chai.request(server).get('/profile/tobiah'))?.account?.name);
  });
  describe('/profile/:username', async () => {
    it('should get profile data', async function root() {
      if (!proceed) this.skip();
      const res = await chai.request(server).get('/profile/tobiah');
      res.should.have.status(200);
      should.exist(res.body);
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
