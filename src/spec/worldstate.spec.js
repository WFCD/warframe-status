'use strict';

const chai = require('chai');
const chaiHttp = require('chai-http');
const server = require('../app');
const { platforms: p, platformAliases: pa } = require('../lib/utilities');

const should = chai.should();
chai.use(chaiHttp);

const platforms = p.concat(pa);
const keys = ['alerts', 'invasions', 'nightwave', 'voidTrader', 'vaultTrader', 'arbitration', 'events', 'sortie', 'syndicateMissions', 'fissures', 'globalUpgrades', 'flashSales', 'darkSectors', 'simaris', 'conclaveChallenges', 'persistentEnemies', 'earthCycle', 'cetusCycle', 'cambionCycle', 'weeklyChallenges', 'constructionProgress', 'vallisCycle', 'kuva', 'steelPath', 'sentientOutposts'];
const langs = ['en', 'zh', 'en-GB', 'en_GB', 'aa'];

describe('worldstate', () => {
  platforms.forEach((platform) => {
    describe(`/${platform}`, () => {
      it('should succeed', async () => {
        if (!server.started) should.fail('server not started');
        let res = await chai.request(server)
          .get(`/${platform}`);
        res.should.have.status(200);
        res.should.have.property('body');
        res.body.should.be.an('object');
        res.body.should.have.property('timestamp');
        res.body.timestamp.should.be.a('string');
        should.exist(new Date(res.body.timestamp));

        keys.forEach((key) => {
          it(`/${platform}/${key}`, async () => {
            if (!server.started) should.fail('server not started');
            res = await chai.request(server)
              .get(`/${platform}/${key}`);
            res.should.have.status(200);
            res.should.have.property('body');
          });

          langs.forEach(async (lang) => {
            if (platform === 'ns') return;

            // /:platform/:locale/:field
            res = await chai.request(server)
              .get(`/${platform}/${lang}/${key}`);
            res.should.have.status(200);
            res.should.have.property('body');

            // /:platform/:field?language=:locale
            res = await chai.request(server)
              .get(`/${platform}/${key}?language=${lang}`);
            res.should.have.status(200);
            res.should.have.property('body');

            // /:platform/:field
            res = await chai.request(server)
              .get(`/${platform}/${key}`)
              .set('Accept-Language', lang);
            res.should.have.status(200);
            res.should.have.property('body');
          });
        });
      });
      it(`/${platform}/en`, async () => {
        if (!server.started) should.fail('server not started');
        const res = await chai.request(server)
          .get(`/${platform}/en`);
        res.should.have.status(200);
        res.should.have.property('body');
      });
    });
  });
  it('should produce a Not Found error', async () => {
    let res = await chai.request(server)
      .get('/pc/foo');
    res.should.have.status(404);
    res.body.should.be.an('object');
    res.body.should.have.property('code')
      .and.eq(404);
    res.body.should.have.property('error')
      .and.eq('No such worldstate field');

    res = await chai.request(server)
      .get('/pc/en/foo');
    res.should.have.status(404);
    res.body.should.be.an('object');
    res.body.should.have.property('code')
      .and.eq(404);
    res.body.should.have.property('error')
      .and.eq('No such worldstate field');
  });
});
