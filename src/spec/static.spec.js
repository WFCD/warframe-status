import chai from 'chai';
import chaiHttp from 'chai-http';
import server from '../app.js';
import { warframeData } from '../lib/utilities.js';

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
          const res = await chai.request(server).get(`/${key}`);
          should.exist(res.body);
          res.should.have.status(200);
        });
        it(`should provide searchability for ${key} data`, async () => {
          const res = await chai.request(server).get(`/${key}/search/a,b,c`);
          should.exist(res.body);
          res.body.should.not.have.property('errors');
          res.should.have.status(200);
        });

        const langTest = async (language, override) => {
          let res = await chai.request(server).get(`/${key}?language=${language}`);
          should.exist(res.body);
          res.body.should.not.have.property('errors');
          res.should.have.status(200);
          res.should.have.header('Content-Language', override || language);

          res = await chai.request(server).get(`/${key}`).set('Accept-Language', language);
          res.should.have.status(200);
          should.exist(res.body);
          res.should.have.header('Content-Language', override || language);

          res = await chai.request(server).get(`/${key}/search/a,b,c?language=${language}`);
          res.should.have.status(200);
          should.exist(res.body);
          res.should.have.header('Content-Language', override || language);

          res = await chai.request(server).get(`/${key}/search/a,b,c`).set('Accept-Language', language);
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
    const res = await chai.request(server).get('/solNodes/search/Galatea,Silvanus,Calypso');
    res.should.have.status(200);
    res.body.should.be.an('array');
    res.body[0].nodes[0].should.be.an('object');
    res.body.length.should.eq(1);
    res.body[0].nodes.length.should.eq(3);
  });
  it('arcanes', async () => {
    const res = await chai.request(server).get('/arcanes/search/Energize,Arachne,Grace,Montoya');
    res.should.have.status(200);
    res.body.should.be.an('array');
    res.body.length.should.eq(3);
    res.body[0].should.be.an('object');
  });
});
