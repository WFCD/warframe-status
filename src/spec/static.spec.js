import * as chai from 'chai';
import chaiHttp from 'chai-http';

import { warframeData } from '../lib/utilities.js';

import { req } from './hooks/start.hook.js';

const should = chai.should();
chai.use(chaiHttp);
const dataKeys = Object.keys(warframeData);
const languages = warframeData.locales.filter((l) => l !== 'en_US');

describe('static data', () => {
  dataKeys
    .filter((k) => !languages.includes(k))
    .forEach((key) => {
      describe(key, () => {
        it(`should provide ${key} data`, async () => {
          const res = req(`/${key}`);
          should.exist(res.body);
          res.should.have.status(200);
        });
        it(`should provide searchability for ${key} data`, async () => {
          const res = req(`/${key}/search/a,b,c`);
          should.exist(res.body);
          res.body.should.not.have.property('errors');
          res.should.have.status(200);
        });

        const langTest = async (language, override) => {
          let res = req(`/${key}?language=${language}`);
          should.exist(res.body);
          res.body.should.not.have.property('errors');
          res.should.have.status(200);
          res.should.have.header('Content-Language', override || language);

          res = req(`/${key}`).set('Accept-Language', language);
          res.should.have.status(200);
          should.exist(res.body);
          res.should.have.header('Content-Language', override || language);

          res = req(`/${key}/search/a,b,c?language=${language}`);
          res.should.have.status(200);
          should.exist(res.body);
          res.should.have.header('Content-Language', override || language);

          res = req(`/${key}/search/a,b,c`).set('Accept-Language', language);
          res.should.have.status(200);
          should.exist(res.body);
          res.should.have.header('Content-Language', override || language);
        };
        languages.forEach((language) => {
          it(`should support ${language} overrides`, async () => langTest(language));
        });
        it('should default to english on fake languages', async () => langTest('uz', 'en'));
      });
    });
  it('nodes', async () => {
    const res = req('/solNodes/search/Galatea,Silvanus,Calypso');
    res.should.have.status(200);
    res.body.should.be.an('array');
    res.body[0].nodes[0].should.be.an('object');
    res.body.length.should.eq(1);
    res.body[0].nodes.length.should.eq(3);
  });
  it('arcanes', async () => {
    const res = req('/arcanes/search/Energize,Arachne,Grace,Montoya');
    res.should.have.status(200);
    res.body.should.be.an('array');
    res.body.length.should.eq(3);
    res.body[0].should.be.an('object');
  });
});
