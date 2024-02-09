import chai from 'chai';
import chaiHttp from 'chai-http';

import server from '../app.js';
import settings from '../lib/settings.js';

chai.should();
chai.use(chaiHttp);

describe('pricecheck', () => {
  beforeEach(() => {
    settings.priceChecks = true;
  });
  it('handles no results', async function noResSearch() {
    this.timeout = 40000;
    const res = await chai.request(server).get('/pricecheck/string/poopoo%20prime');
    res.should.have.status(200);
    res.body.should.be.a('string');
    res.body.should.include('no such item');
  });
  it('supports string search', async function stringSearch() {
    this.timeout = 60000;
    const res = await chai.request(server).get('/pricecheck/string/nikana%20prime');
    res.should.have.status(200);
    res.body.should.be.a('string');
    res.body.should.not.include('no such item');
  });
  it('supports attachment search', async function attachmentSearch() {
    this.timeout = 60000;
    const res = await chai.request(server).get('/pricecheck/attachment/nikana%20prime');
    res.should.have.status(200);
    res.body.should.be.an('array');
    res.body[0].should.be.an('object');
    res.body.should.not.include('no such item');
    res.body[0].title.should.include('[PC]');
    res.body[0].title.should.include('Nikana Prime');
    res.body[0].fields.should.be.an('array');
    res.body[0].fields.length.should.eq(4);
    res.body[0].thumbnail.url.should.include('https://warframe.market/static/assets');
    res.body[0].footer.icon_url.should.include('https://warframestat.us/');
  });
  it('supports raw search', async function rawSearch() {
    this.timeout = 60000;
    const res = await chai.request(server).get('/pricecheck/find/nikana%20prime');
    res.should.have.status(200);
    res.body.should.be.an('array');
    res.body.length.should.be.greaterThanOrEqual(3);
    res.body.should.not.include('no such item');
  });
  it('503s when disabled', async () => {
    settings.priceChecks = false;
    const res = await chai
      .request(server)
      .get('/pricecheck/attachment/nikana%20prime')
      .set('Cache-Control', 'no-cache');
    res.should.have.status(503);
    res.body.should.be.an('object');
    res.body.should.have.property('error', 'Service temporarily unavailable');
    res.body.should.have.property('code', 503);
  });
});
