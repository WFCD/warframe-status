'use strict';

const chai = require('chai');
const chaiHttp = require('chai-http');
const rewire = require('rewire');
const server = require('../app');

const Settings = rewire('../lib/settings');

chai.use(chaiHttp);

const original = {
  filteredItems: process.env.WFINFO_FILTERED_ITEMS,
  prices: process.env.WFINFO_PRICES,
};

const overrideWFInfo = (filtered, prices) => {
  Settings.__set__('wfInfo', { filteredItems: filtered, prices });
};

const resetWFInfo = () => {
  Settings.__set__('wfInfo', original);
};

describe('wfinfo', () => {
  afterEach(resetWFInfo);

  describe('filtered_items', () => {
    if (process.env.WFINFO_FILTERED_ITEMS) {
      it('should not be empty', async () => {
        const res = await chai.request(server)
          .get('/wfinfo/filtered_items');
        res.should.have.status(200);
        res.body.should.be.an('object');
        Object.keys(res.body).length.should.eq(5);
        res.body.should.have.keys(['timestamp', 'errors', 'relics', 'eqmt', 'ignored_items']);
      });
      it('should be unavailable', async () => {
        overrideWFInfo(undefined, Settings.__get__('wfinfo').prices);
        const res = await chai.request(server)
          .get('/wfinfo/filtered_items');
        res.should.have.status(503);
      });
    } else {
      it('should be unavailable', async () => {
        const res = await chai.request(server)
          .get('/wfinfo/filtered_items');
        res.should.have.status(503);
      });
    }
  });

  describe('prices', () => {
    if (process.env.WFINFO_PRICES) {
      it('should not be empty', async () => {
        const res = await chai.request(server)
          .get('/wfinfo/prices');
        res.should.have.status(200);
        res.body.should.be.an('array');
        res.body[0].should.have.keys(['name', 'yesterday_vol', 'today_vol', 'custom_avg']);
      });
      it('should be unavailable', async () => {
        overrideWFInfo(Settings.__get__('wfinfo').prices, undefined);
        const res = await chai.request(server)
          .get('/wfinfo/prices');
        res.should.have.status(503);
      });
    } else {
      it('should be unavailable', async () => {
        const res = await chai.request(server)
          .get('/wfinfo/prices');
        res.should.have.status(503);
      });
    }
  });
});
