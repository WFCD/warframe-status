import * as chai from 'chai';
import chaiHttp, { request } from 'chai-http';

import server from '../app.js';
import { twitter } from '../lib/settings.js';

const should = chai.should();
chai.use(chaiHttp);

describe('twitter', () => {
  describe('/', async () => {
    it.skip('should get twitter data', async function root() {
      if (!twitter.active) this.skip();
      const res = await request.execute(server).get('/twitter');
      res.should.have.status(200);
      should.exist(res.body);
      res.body.should.be.an('array');
      res.body.length.should.eq(14); // if it doesn't, we're missing a tweet from someone
      res.body.forEach((tweet) => {
        tweet.should.be.an('object');
        tweet.should.include.all.keys('id', 'uniqueId', 'text', 'url', 'isReply', 'author', 'createdAt');
        tweet.author.should.include.all.keys('name', 'handle', 'url', 'avatar');
        tweet?.retweet?.should.include.all.keys('text', 'author');
        tweet?.retweet?.author.should.include.all.keys('name', 'handle');
      });
    });
    it('should error with data off', async () => {
      twitter.active = false;
      const res = await request.execute(server).get('/twitter');
      res.should.have.status(404);
      res.body.should.be.an('object').and.include.all.keys('code', 'error');
      res.body.code.should.eq(404);
      res.body.error.should.eq('No Twitter Data');
    });
  });
});
