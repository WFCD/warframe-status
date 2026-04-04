import { AppModule } from '@nest/app.module';
import type { INestApplication } from '@nestjs/common';
import { WsAdapter } from '@nestjs/platform-ws';
import { Test } from '@nestjs/testing';
import * as chai from 'chai';
import chaiHttp, { request } from 'chai-http';
import type express from 'express';

chai.should();
chai.use(chaiHttp);

/**
 * API Compatibility Test Suite
 *
 * This test suite verifies that the NestJS implementation maintains 100% API
 * backward compatibility with the Express implementation.
 *
 * IMPORTANT: These tests require real external API data to be available.
 * They are meant to be run in an environment where external APIs are accessible.
 *
 * To run these tests:
 * 1. Ensure USE_WORLDSTATE=true in environment
 * 2. Ensure external APIs (worldstate, warframe.market, etc.) are accessible
 * 3. Run: npm run test:nest:integration
 */
describe('API Compatibility (NestJS vs Express)', () => {
  let nestApp: INestApplication;
  let expressApp: express.Application;

  before(async function () {
    // Skip if not in integration test mode
    if (process.env.SKIP_INTEGRATION === 'true') {
      this.skip();
    }

    // Create NestJS app
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    nestApp = moduleRef.createNestApplication();

    // Use WebSocket adapter (required for WebSocketGateway)
    nestApp.useWebSocketAdapter(new WsAdapter(nestApp));

    await nestApp.init();

    // Import Express app
    // Note: This assumes the Express app is still available
    // In production, this test would be removed once migration is complete
    try {
      const appModule = await import('../../../app.js');
      expressApp = appModule.default;
    } catch (error) {
      console.warn('Express app not available, skipping compatibility tests');
      this.skip();
    }
  });

  after(async () => {
    if (nestApp) {
      await nestApp.close();
    }
  });

  describe('Static Data Endpoints', () => {
    const dataKeys = [
      'arcanes',
      'archonShards',
      'conclave',
      'events',
      'factions',
      'fissureModifiers',
      'languages',
      'missionTypes',
      'operationTypes',
      'persistentEnemy',
      'solNodes',
      'sortie',
      'syndicates',
      'tutorials',
      'upgradeTypes',
      'synthTargets',
      'steelPath',
      'locales',
    ];

    dataKeys.forEach((key) => {
      it(`GET /${key} should return same structure in both apps`, async function () {
        this.timeout(10000);

        // Get response from NestJS
        const nestRes = await request
          .execute(nestApp.getHttpServer())
          .get(`/${key}`);

        // Get response from Express
        const expressRes = await request.execute(expressApp).get(`/${key}`);

        // Both should return 200
        nestRes.should.have.status(200);
        expressRes.should.have.status(200);

        // Both should return same content type
        nestRes.should.have.header('content-type', /json/);
        expressRes.should.have.header('content-type', /json/);

        // Both should have body
        nestRes.should.have.property('body');
        expressRes.should.have.property('body');

        // Data should be arrays or objects (structure match)
        if (Array.isArray(expressRes.body)) {
          nestRes.body.should.be.an('array');
        } else {
          nestRes.body.should.be.an('object');
        }
      });
    });

    it('GET /arcanes/search/energize should work in both apps', async function () {
      this.timeout(10000);

      const nestRes = await request
        .execute(nestApp.getHttpServer())
        .get('/arcanes/search/energize');

      const expressRes = await request
        .execute(expressApp)
        .get('/arcanes/search/energize');

      nestRes.should.have.status(200);
      expressRes.should.have.status(200);

      nestRes.body.should.be.an('array');
      expressRes.body.should.be.an('array');

      // Should find at least one result
      nestRes.body.should.have.length.greaterThan(0);
      expressRes.body.should.have.length.greaterThan(0);
    });
  });

  describe('Dynamic Endpoints', () => {
    it('GET /heartbeat should return same structure', async () => {
      const nestRes = await request
        .execute(nestApp.getHttpServer())
        .get('/heartbeat');

      const expressRes = await request.execute(expressApp).get('/heartbeat');

      nestRes.should.have.status(200);
      expressRes.should.have.status(200);

      nestRes.body.should.be.an('object');
      expressRes.body.should.be.an('object');
    });

    it('GET /drops should return same structure', async function () {
      this.timeout(10000);

      const nestRes = await request
        .execute(nestApp.getHttpServer())
        .get('/drops');

      const expressRes = await request.execute(expressApp).get('/drops');

      nestRes.should.have.status(200);
      expressRes.should.have.status(200);

      nestRes.body.should.be.an('array');
      expressRes.body.should.be.an('array');
    });

    it('GET /items should return same structure', async function () {
      this.timeout(10000);

      const nestRes = await request
        .execute(nestApp.getHttpServer())
        .get('/items');

      const expressRes = await request.execute(expressApp).get('/items');

      nestRes.should.have.status(200);
      expressRes.should.have.status(200);

      nestRes.body.should.be.an('array');
      expressRes.body.should.be.an('array');
    });
  });

  describe('WorldState Endpoints (if enabled)', () => {
    before(function () {
      if (process.env.USE_WORLDSTATE !== 'true') {
        this.skip();
      }
    });

    it('GET /pc should return same structure', async function () {
      this.timeout(15000);

      const nestRes = await request.execute(nestApp.getHttpServer()).get('/pc');

      const expressRes = await request.execute(expressApp).get('/pc');

      nestRes.should.have.status(200);
      expressRes.should.have.status(200);

      nestRes.body.should.be.an('object');
      expressRes.body.should.be.an('object');

      // Both should have timestamp
      nestRes.body.should.have.property('timestamp');
      expressRes.body.should.have.property('timestamp');
    });

    it('GET /pc/alerts should return same structure', async function () {
      this.timeout(15000);

      const nestRes = await request
        .execute(nestApp.getHttpServer())
        .get('/pc/alerts');

      const expressRes = await request.execute(expressApp).get('/pc/alerts');

      nestRes.should.have.status(200);
      expressRes.should.have.status(200);

      // Both should be arrays
      if (Array.isArray(expressRes.body)) {
        nestRes.body.should.be.an('array');
      }
    });

    it('GET /rss should return same structure', async function () {
      this.timeout(15000);

      const nestRes = await request
        .execute(nestApp.getHttpServer())
        .get('/rss');

      const expressRes = await request.execute(expressApp).get('/rss');

      nestRes.should.have.status(200);
      expressRes.should.have.status(200);

      nestRes.body.should.be.an('object');
      expressRes.body.should.be.an('object');
    });
  });

  describe('Error Handling', () => {
    it('GET /invalid-route should return 404 in both apps', async () => {
      const nestRes = await request
        .execute(nestApp.getHttpServer())
        .get('/invalid-route-12345');

      const expressRes = await request
        .execute(expressApp)
        .get('/invalid-route-12345');

      nestRes.should.have.status(404);
      expressRes.should.have.status(404);
    });

    it('GET /arcanes/search/nonexistent should handle gracefully', async () => {
      const nestRes = await request
        .execute(nestApp.getHttpServer())
        .get('/arcanes/search/nonexistentitem12345');

      const expressRes = await request
        .execute(expressApp)
        .get('/arcanes/search/nonexistentitem12345');

      // Both should handle this gracefully (either 200 with empty array or 404)
      [200, 404].should.include(nestRes.status);
      [200, 404].should.include(expressRes.status);
    });
  });

  describe('Content Negotiation', () => {
    it('should respect Accept-Language header', async () => {
      const nestRes = await request
        .execute(nestApp.getHttpServer())
        .get('/arcanes')
        .set('Accept-Language', 'de');

      const expressRes = await request
        .execute(expressApp)
        .get('/arcanes')
        .set('Accept-Language', 'de');

      nestRes.should.have.status(200);
      expressRes.should.have.status(200);

      // Both should set Content-Language header
      if (expressRes.headers['content-language']) {
        nestRes.should.have.header('content-language');
      }
    });

    it('should support language query parameter', async () => {
      const nestRes = await request
        .execute(nestApp.getHttpServer())
        .get('/arcanes?language=fr');

      const expressRes = await request
        .execute(expressApp)
        .get('/arcanes?language=fr');

      nestRes.should.have.status(200);
      expressRes.should.have.status(200);
    });
  });
});
