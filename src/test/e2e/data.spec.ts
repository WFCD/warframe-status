import * as chai from 'chai';
import chaiHttp from 'chai-http';
import wfData from 'warframe-worldstate-data';

import { req } from '../hooks/setup.hook';

const should = chai.should();
chai.use(chaiHttp);

describe('DataController (static data)', () => {
  const warframeData = wfData as any;
  const dataKeys = Object.keys(warframeData);
  const languages = warframeData.locales.filter((l: string) => l !== 'en_US');

  dataKeys
    .filter((k: string) => !languages.includes(k))
    .forEach((key: string) => {
      describe(key, () => {
        it(`should provide ${key} data`, async () => {
          const res = await req(`/${key}`);
          should.exist(res.body);
          res.should.have.status(200);
        });

        it(`should provide searchability for ${key} data`, async () => {
          const res = await req(`/${key}/search/a,b,c`);
          should.exist(res.body);
          res.body.should.not.have.property('errors');
          res.should.have.status(200);
        });

        const langTest = async (language: string, override?: string) => {
          let res = await req(`/${key}?language=${language}`);
          should.exist(res.body);
          res.body.should.not.have.property('errors');
          res.should.have.status(200);
          res.should.have.header('Content-Language', override || language);

          res = await req(`/${key}`).set('Accept-Language', language);
          res.should.have.status(200);
          should.exist(res.body);
          res.should.have.header('Content-Language', override || language);

          res = await req(`/${key}/search/a,b,c?language=${language}`);
          res.should.have.status(200);
          should.exist(res.body);
          res.should.have.header('Content-Language', override || language);

          res = await req(`/${key}/search/a,b,c`).set(
            'Accept-Language',
            language,
          );
          res.should.have.status(200);
          should.exist(res.body);
          res.should.have.header('Content-Language', override || language);
        };

        languages.forEach((language: string) => {
          it(`should support ${language} overrides`, async () =>
            langTest(language));
        });

        it('should default to english on fake languages', async () =>
          langTest('uz', 'en'));
      });
    });

  it('nodes', async () => {
    const res = await req('/solNodes/search/Galatea,Silvanus,Calypso');
    res.should.have.status(200);
    res.body.should.be.an('array');
    res.body[0].nodes[0].should.be.an('object');
    res.body.length.should.eq(1);
    res.body[0].nodes.length.should.eq(3);
  });

  it('arcanes', async () => {
    const res = await req('/arcanes/search/Energize,Arachne,Grace,Montoya');
    res.should.have.status(200);
    res.body.should.be.an('array');
    res.body.length.should.eq(3);
    res.body[0].should.be.an('object');
  });
});
