import { HeartbeatController } from '@controllers/heartbeat.controller';
import { OpenApiController } from '@controllers/openapi.controller';
import { setupOpenApi } from '@nest/config/openapi-document';
import type { INestApplication } from '@nestjs/common';
import { InternalServerErrorException } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import type { TestingModule } from '@nestjs/testing';
import { Test } from '@nestjs/testing';
import { OpenApiDocumentService } from '@services/openapi-document.service';
import { WorldStateService } from '@services/worldstate.service';
import { expect } from 'chai';

describe('WorldStateService (unit)', () => {
  const logger = {
    setContext: () => undefined,
    getWinston: () => ({}),
    info: () => undefined,
    warn: () => undefined,
    debug: () => undefined,
    error: () => undefined,
  };

  let service: WorldStateService;
  let fakeEmitter: {
    getWorldstate: (language: string) => unknown;
    getTwitter: () => Promise<unknown>;
    getRss: () => unknown;
  };

  beforeEach(async () => {
    fakeEmitter = {
      getWorldstate: (language: string) => ({ language }),
      getTwitter: async () => [{ id: 'tweet-1' }],
      getRss: () => [{ title: 'News' }],
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        WorldStateService,
        { provide: 'LOGGER_SERVICE', useValue: logger },
        { provide: EventEmitter2, useValue: { emit: () => undefined } },
      ],
    }).compile();

    service = module.get(WorldStateService);
    (
      service as unknown as { emitter: typeof fakeEmitter | undefined }
    ).emitter = fakeEmitter;
  });

  it('returns worldstate from the emitter', () => {
    expect(service.getWorldstate('en')).to.deep.equal({ language: 'en' });
  });

  it('returns undefined when the emitter throws while resolving worldstate', () => {
    fakeEmitter.getWorldstate = () => {
      throw new Error('boom');
    };

    expect(service.getWorldstate('en')).to.equal(undefined);
  });

  it('throws when requesting worldstate before initialization', () => {
    (service as unknown as { emitter: undefined }).emitter = undefined;

    expect(() => service.getWorldstate('en')).to.throw(
      InternalServerErrorException,
    );
  });

  it('returns twitter data from the emitter', async () => {
    const twitter = await service.getTwitter();
    expect(twitter).to.deep.equal([{ id: 'tweet-1' }]);
  });

  it('returns rss data from the emitter', () => {
    expect(service.getRss()).to.deep.equal([{ title: 'News' }]);
  });

  it('exposes the underlying emitter instance', () => {
    expect(service.getEmitter()).to.equal(fakeEmitter);
  });
});

describe('setupOpenApi', () => {
  let app: INestApplication;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      controllers: [OpenApiController, HeartbeatController],
      providers: [OpenApiDocumentService],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  afterEach(async () => {
    await app.close();
  });

  it('builds and stores the OpenAPI document on the app', () => {
    const document = setupOpenApi(app);
    expect(document.openapi).to.match(/^3\./);
    expect(app.get(OpenApiDocumentService).getDocument()).to.equal(document);
  });
});
