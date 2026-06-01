import '@nest/config/test-env-setup';

import { WorldstateController } from '@controllers/worldstate.controller';
import type { INestApplication } from '@nestjs/common';
import type { TestingModule } from '@nestjs/testing';
import { Test } from '@nestjs/testing';
import * as chai from 'chai';
import chaiHttp, { request } from 'chai-http';
import {
  MockWorldStateService,
  mockWorldStateData,
} from '../mocks/worldstate.mock';

chai.should();
chai.use(chaiHttp);

const GENERATED_PC_FIELDS = [
  'alerts',
  'arbitration',
  'archimedeas',
  'archonHunt',
  'buildLabel',
  'calendar',
  'cambionCycle',
  'cetusCycle',
  'conclaveChallenges',
  'constructionProgress',
  'dailyDeals',
  'darkSectors',
  'duviriCycle',
  'earthCycle',
  'events',
  'faceoffBonus',
  'fissures',
  'flashSales',
  'globalUpgrades',
  'invasions',
  'kinepage',
  'kuva',
  'news',
  'nightwave',
  'persistentEnemies',
  'questToConquerCancer',
  'sentientOutposts',
  'simaris',
  'sortie',
  'steelPath',
  'syndicateMissions',
  'timestamp',
  'vallisCycle',
  'vaultTrader',
  'voidTrader',
  'voidTraders',
  'weeklyChallenges',
  'zarimanCycle',
];

describe('worldstate (mocked)', () => {
  let app: INestApplication;
  let mockWorldStateService: MockWorldStateService;

  before(async function () {
    this.timeout(30000);

    mockWorldStateService = new MockWorldStateService();

    const moduleFixture: TestingModule = await Test.createTestingModule({
      controllers: [WorldstateController],
      providers: [
        { provide: 'WORLDSTATE_SERVICE', useValue: mockWorldStateService },
        {
          provide: 'LOGGER_SERVICE',
          useValue: {
            info: () => undefined,
            debug: () => undefined,
            warn: () => undefined,
            error: () => undefined,
          },
        },
      ],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  after(async () => {
    if (app) {
      await app.close();
    }
  });

  describe('GET /:platform', () => {
    it('should return worldstate for pc', async () => {
      const res = await request.execute(app.getHttpServer()).get('/pc');
      res.should.have.status(200);
      res.body.should.deep.equal(mockWorldStateData);
      res.should.have.header('content-language', 'en');
    });

    it('should redirect legacy console platforms to pc', async () => {
      const res = await request.execute(app.getHttpServer()).get('/ps4');
      res.should.have.status(200);
      res.body.should.deep.equal(mockWorldStateData);
    });

    it('should 404 for invalid platforms', async () => {
      const res = await request.execute(app.getHttpServer()).get('/nope');
      res.should.have.status(404);
    });
  });

  describe('GET /:platform/:field', () => {
    it('should return a specific field', async () => {
      const res = await request.execute(app.getHttpServer()).get('/pc/alerts');
      res.should.have.status(200);
      res.body.should.be.an('array');
      res.body.length.should.equal(1);
    });

    it('should filter array fields', async () => {
      const res = await request
        .execute(app.getHttpServer())
        .get('/pc/alerts?filter=id:test-alert-1');
      res.should.have.status(200);
      res.body.should.be.an('array');
      res.body.length.should.equal(1);
    });

    it('should return object fields', async () => {
      const res = await request.execute(app.getHttpServer()).get('/pc/sortie');
      res.should.have.status(200);
      res.body.should.be.an('object');
      res.body.boss.should.equal('Kela');
    });

    it('should support language-prefixed routes', async () => {
      const res = await request.execute(app.getHttpServer()).get('/en/alerts');
      res.should.have.status(200);
      res.body.should.be.an('array');
      res.should.have.header('content-language', 'en');
    });

    it('should treat short language-like fields as language selectors', async () => {
      const res = await request.execute(app.getHttpServer()).get('/pc/en');
      res.should.have.status(200);
      res.body.should.deep.equal(mockWorldStateData);
    });

    it('should 404 for unknown fields', async () => {
      const res = await request
        .execute(app.getHttpServer())
        .get('/pc/notARealFieldName');
      res.should.have.status(404);
    });
  });

  describe('generated pc field routes', () => {
    for (const field of GENERATED_PC_FIELDS) {
      it(`GET /pc/${field} should succeed`, async () => {
        const res = await request
          .execute(app.getHttpServer())
          .get(`/pc/${field}`);
        res.should.have.status(200);
        res.body.should.exist;
      });
    }

    it('GET /pc/alerts should support filtering', async () => {
      const res = await request
        .execute(app.getHttpServer())
        .get('/pc/alerts?filter=id:test-alert-1');
      res.should.have.status(200);
      res.body.should.be.an('array');
      res.body.length.should.equal(1);
    });
  });

  describe('missing worldstate data', () => {
    it('should 404 when worldstate is unavailable', async () => {
      const original = mockWorldStateService.getWorldstate.bind(
        mockWorldStateService,
      );
      mockWorldStateService.getWorldstate = () => undefined;

      const res = await request.execute(app.getHttpServer()).get('/pc');
      res.should.have.status(404);

      mockWorldStateService.getWorldstate = original;
    });

    it('should 404 when a generated field is absent', async () => {
      const original = mockWorldStateService.getWorldstate.bind(
        mockWorldStateService,
      );
      mockWorldStateService.getWorldstate = () => ({
        ...mockWorldStateData,
        alerts: undefined,
      });

      const res = await request.execute(app.getHttpServer()).get('/pc/alerts');
      res.should.have.status(404);

      mockWorldStateService.getWorldstate = original;
    });
  });
});
