'use strict';

const chai = require('chai');
const chaiHttp = require('chai-http');
const server = require('../app');
const Settings = require('../lib/settings');

const should = chai.should();
chai.use(chaiHttp);

describe('twitter', () => {
  describe('/', async () => {
    it('should get twitter data', async function root() {
      if (!Settings.twitter.active) this.skip();
      const res = await chai.request(server).get('/twitter');
      res.should.have.status(200);
      should.exist(res.body);
      res.body.should.be.an('array');
      res.body.length.should.eq(15); // if it doesn't, we're missing a tweet from someone
      res.body.forEach((tweet) => {
        tweet.should.be.an('object');
        tweet.should.include.all.keys('id', 'uniqueId', 'text', 'url', 'isReply', 'author', 'createdAt');
        tweet.author.should.include.all.keys('name', 'handle', 'url', 'avatar');
        tweet?.retweet?.should.include.all.keys('text', 'author');
        tweet?.retweet?.author.should.include.all.keys('name', 'handle');
      });
    });
    it('should error with data off', async () => {
      Settings.twitter.active = false;
      const res = await chai.request(server).get('/twitter');
      res.should.have.status(404);
      res.body.should.be.an('object').and.include.all.keys('code', 'error');
      res.body.code.should.eq(404);
      res.body.error.should.eq('No Twitter Data');
    });
  });
});
