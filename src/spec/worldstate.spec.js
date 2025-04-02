import * as chai from 'chai';
import chaiHttp, { request } from 'chai-http';

import app from '../app.js';
import * as utils from '../lib/utilities.js';

import { req } from './hooks/start.hook.js';

const { platforms: p, platformAliases: pa } = utils;
const should = chai.should();
chai.use(chaiHttp);

const platforms = p.concat(pa);
const keys = [
  'alerts',
  'invasions',
  'nightwave',
  'voidTrader',
  'vaultTrader',
  'arbitration',
  'events',
  'sortie',
  'syndicateMissions',
  'fissures',
  'globalUpgrades',
  'flashSales',
  'darkSectors',
  'simaris',
  'conclaveChallenges',
  'persistentEnemies',
  'earthCycle',
  'cetusCycle',
  'cambionCycle',
  'weeklyChallenges',
  'constructionProgress',
  'vallisCycle',
  'kuva',
  'steelPath',
  'sentientOutposts',
];
const langs = ['en', 'zh', 'en-GB', 'en_GB', 'aa'];

const grab = async (path) => {
  return req(`/${path}/?language=en`).body;
};

const data = {
  items: undefined,
  weapons: undefined,
  warframes: undefined,
  mods: undefined,
};

data.items = await grab('items');
data.weapons = await grab('weapons');
data.warframes = await grab('warframes');
data.mods = await grab('mods');

// this spec is a little polluted,
// because it takes time for the worldstate emitter to get fired up and updating,
// so this needs to always run last
describe('worldstate', () => {
  it('should 404 on invalid worldstate keys', async () => {
    if (!app.started) should.fail('server not started');
    // purposeful typo
    const res = await req(`/pc/deepArchimedia`).redirects(2).send();
    res.should.have.status(404);
  });
  platforms.forEach((platform) => {
    describe(`/${platform}`, () => {
      it('should succeed', async () => {
        if (!app.started) should.fail('server not started');
        let res = await req(`/${platform}`).redirects(2).send();
        res.should.have.status(200);
        res.should.have.property('body');
        res.body.should.be.an('object');
        res.body.should.have.property('timestamp');
        res.body.timestamp.should.be.a('string');
        should.exist(new Date(res.body.timestamp));

        keys.forEach((key) => {
          it(`/${platform}/${key}`, async () => {
            if (!app.started) should.fail('server not started');
            res = await req(`/${platform}/${key}`).redirects(2).send();
            res.should.have.status(200);
            res.should.have.property('body');
          });

          langs.forEach(async (lang) => {
            if (platform === 'ns') return;

            // /:platform/:locale/:field
            res = await req(`/${platform}/${lang}/${key}`).redirects(2).send();
            res.should.have.status(200);
            res.should.have.property('body');

            // /:platform/:field?language=:locale
            res = await req(`/${platform}/${key}?language=${lang}`).redirects(2).send();
            res.should.have.status(200);
            res.should.have.property('body');

            // /:platform/:field
            res = await request
              .execute(app)
              .get(`/${platform}/${key}`)
              .set('Accept-Language', lang)
              .redirects(2)
              .send();
            res.should.have.status(200);
            res.should.have.property('body');
          });
        });
      });
      it(`/${platform}/en`, async () => {
        if (!app.started) should.fail('server not started');
        const res = await req(`/${platform}/en`).redirects(2).send();
        res.should.have.status(200);
        res.should.have.property('body');
      });
    });
  });
  it('should produce a Not Found error', async () => {
    let res = await req('/pc/foo');
    res.should.have.status(404);
    res.body.should.be.an('object');
    res.body.should.have.property('code').and.eq(404);
    res.body.should.have.property('error').and.eq('No such worldstate field');

    res = await req('/pc/en/foo');
    res.should.have.status(404);
    res.body.should.be.an('object');
    res.body.should.have.property('code').and.eq(404);
    res.body.should.have.property('error').and.eq('No such worldstate field');
  });
});

const namedExclusions = ['Excalibur Prime'];
describe('item data', () => {
  data.warframes
    ?.filter((w) => !namedExclusions.includes(w.name))
    .forEach((warframe) => {
      it(`${warframe.name} should have components`, () => {
        should.exist(warframe);
        should.exist(warframe.components);
        warframe.components.length.should.be.greaterThan(0);
      });
    });
});
