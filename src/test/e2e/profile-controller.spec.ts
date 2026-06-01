import { ProfileController } from '@controllers/profile.controller';
import type { INestApplication } from '@nestjs/common';
import type { TestingModule } from '@nestjs/testing';
import { Test } from '@nestjs/testing';
import type { ProfileService } from '@services/profile.service';
import * as chai from 'chai';
import chaiHttp, { request } from 'chai-http';

chai.should();
chai.use(chaiHttp);

describe('ProfileController (mocked)', () => {
  let app: INestApplication;
  const profileService = {
    getProfile: async () => ({ displayName: 'TestPlayer' }),
    getXpInfo: async () => [{ uniqueName: '/Lotus/Test', xp: 100 }],
    getStats: async () => ({ guildName: 'Test Guild', missionsCompleted: 1 }),
    getArsenal: async () => ({ account: { name: 'TestPlayer' } }),
  } satisfies Pick<
    ProfileService,
    'getProfile' | 'getXpInfo' | 'getStats' | 'getArsenal'
  >;

  before(async function () {
    this.timeout(30000);

    const moduleFixture: TestingModule = await Test.createTestingModule({
      controllers: [ProfileController],
      providers: [{ provide: 'PROFILE_SERVICE', useValue: profileService }],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  after(async () => {
    if (app) {
      await app.close();
    }
  });

  it('GET /profile/:playerId should return profile data', async () => {
    const res = await request
      .execute(app.getHttpServer())
      .get('/profile/test-player?withItem=true&language=de')
      .set('Accept-Language', 'fr');
    res.should.have.status(200);
    res.body.displayName.should.equal('TestPlayer');
  });

  it('GET /profile/:playerId/xpInfo should return xp info', async () => {
    const res = await request
      .execute(app.getHttpServer())
      .get('/profile/test-player/xpInfo?withItem=true');
    res.should.have.status(200);
    res.body.should.be.an('array');
    res.body[0].xp.should.equal(100);
  });

  it('GET /profile/:playerId/stats should return stats', async () => {
    const res = await request
      .execute(app.getHttpServer())
      .get('/profile/test-player/stats');
    res.should.have.status(200);
    res.body.guildName.should.equal('Test Guild');
  });

  it('GET /profile/:username/arsenal should return arsenal data', async () => {
    const res = await request
      .execute(app.getHttpServer())
      .get('/profile/test-player/arsenal?platform=pc')
      .set('platform', 'pc');
    res.should.have.status(200);
    res.body.account.name.should.equal('TestPlayer');
  });

  it('should 404 when profile data is missing', async () => {
    profileService.getProfile = async () => undefined;

    const res = await request
      .execute(app.getHttpServer())
      .get('/profile/missing');
    res.should.have.status(404);
    res.body.error.should.equal('No Result');

    profileService.getProfile = async () => ({ displayName: 'TestPlayer' });
  });

  it('should 404 when xp info is missing', async () => {
    profileService.getXpInfo = async () => undefined;

    const res = await request
      .execute(app.getHttpServer())
      .get('/profile/missing/xpInfo');
    res.should.have.status(404);

    profileService.getXpInfo = async () => [
      { uniqueName: '/Lotus/Test', xp: 100 },
    ];
  });

  it('should 404 when stats are missing', async () => {
    profileService.getStats = async () => undefined;

    const res = await request
      .execute(app.getHttpServer())
      .get('/profile/missing/stats');
    res.should.have.status(404);

    profileService.getStats = async () => ({
      guildName: 'Test Guild',
      missionsCompleted: 1,
    });
  });

  it('should 503 when arsenal service is unavailable', async () => {
    profileService.getArsenal = async () => {
      throw new Error('Twitch token not available');
    };

    const res = await request
      .execute(app.getHttpServer())
      .get('/profile/test-player/arsenal');
    res.should.have.status(503);
    res.body.error.should.equal('Service Unavailable');

    profileService.getArsenal = async () => ({
      account: { name: 'TestPlayer' },
    });
  });

  it('should 404 when arsenal data is missing', async () => {
    profileService.getArsenal = async () => undefined;

    const res = await request
      .execute(app.getHttpServer())
      .get('/profile/missing/arsenal');
    res.should.have.status(404);

    profileService.getArsenal = async () => ({
      account: { name: 'TestPlayer' },
    });
  });
});
