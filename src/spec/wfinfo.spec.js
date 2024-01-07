import chai from 'chai';
import chaiHttp from 'chai-http';
import server from '../app.js';

/* eslint-disable import/no-named-as-default-member */
import settings from '../lib/settings.js';

chai.use(chaiHttp);

const original = {
  filteredItems: process.env.WFINFO_FILTERED_ITEMS,
  prices: process.env.WFINFO_PRICES,
};

const resetWFInfo = () => {
  settings.wfInfo = original;
};

describe('wfinfo', () => {
  afterEach(resetWFInfo);

  describe('filtered_items', () => {
    if (settings.wfInfo.filteredItems) {
      it('should not be empty', async () => {
        const res = await chai.request(server).get('/wfinfo/filtered_items');
        res.should.have.status(200);
        res.body.should.be.an('object');
        Object.keys(res.body).length.should.eq(5);
        res.body.should.have.keys(['timestamp', 'errors', 'relics', 'eqmt', 'ignored_items']);
      });
      it('should be unavailable', async () => {
        settings.wfInfo.filteredItems = undefined;
        const res = await chai.request(server).get('/wfinfo/filtered_items');
        res.should.have.status(503);
      });
    } else {
      it('should be unavailable', async () => {
        const res = await chai.request(server).get('/wfinfo/filtered_items');
        res.should.have.status(503);
      });
    }
  });

  describe('prices', () => {
    if (settings.wfInfo.prices) {
      it('should not be empty', async () => {
        const res = await chai.request(server).get('/wfinfo/prices');
        res.should.have.status(200);
        res.body.should.be.an('array');
        res.body[0].should.have.keys(['name', 'yesterday_vol', 'today_vol', 'custom_avg']);
      });
      it('should be unavailable', async () => {
        settings.wfInfo.prices = undefined;
        const res = await chai.request(server).get('/wfinfo/prices');
        res.should.have.status(503);
      });
    } else {
      it('should be unavailable', async () => {
        const res = await chai.request(server).get('/wfinfo/prices');
        res.should.have.status(503);
      });
    }
  });
});
