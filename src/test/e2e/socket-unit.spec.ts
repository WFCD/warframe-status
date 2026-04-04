// Set environment variables before any imports
process.env.USE_WORLDSTATE = 'true';
process.env.FEATURES = 'worldstate,SOCKET';
process.env.WS_EMITTER_FEATURES = 'rss,rivens,worldstate';

import { AppModule } from '@nest/app.module';
import type { INestApplication } from '@nestjs/common';
import { WsAdapter } from '@nestjs/platform-ws';
import type { TestingModule } from '@nestjs/testing';
import { Test } from '@nestjs/testing';
import { expect } from 'chai';
import { WebSocket } from 'ws';
import {
  MockWorldStateService,
  mockRssData,
  mockTwitterData,
  mockWorldStateData,
} from '../mocks/worldstate.mock';

describe('/socket (unit tests with mocks)', () => {
  let app: INestApplication;
  let mockWorldStateService: MockWorldStateService;

  before(async function () {
    this.timeout(30000);

    // Create mock WorldStateService instance
    mockWorldStateService = new MockWorldStateService();

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider('WORLDSTATE_SERVICE')
      .useValue(mockWorldStateService)
      .compile();

    app = moduleFixture.createNestApplication();
    app.useWebSocketAdapter(new WsAdapter(app));
    await app.init();
    await app.listen(0); // Random port
  });

  after(async () => {
    if (app) {
      await app.close();
    }
  });

  describe('WebSocket Connection', () => {
    it('should establish connection and receive connected event', (done) => {
      const server = app.getHttpServer();
      const address = server.address();
      const port = typeof address === 'string' ? 3000 : address?.port || 3000;

      const ws = new WebSocket(`ws://localhost:${port}/socket`);

      ws.on('open', () => {
        // Connection opened successfully
      });

      ws.on('message', (data) => {
        const message = JSON.parse(data.toString());
        if (message.event === 'connected') {
          expect(message.event).to.equal('connected');
          expect(message.status).to.equal(200);
          ws.close();
          done();
        }
      });

      ws.on('error', (error) => {
        done(error);
      });
    });

    it('should close connection gracefully', (done) => {
      const server = app.getHttpServer();
      const address = server.address();
      const port = typeof address === 'string' ? 3000 : address?.port || 3000;

      const ws = new WebSocket(`ws://localhost:${port}/socket`);

      ws.on('open', () => {
        ws.close();
      });

      ws.on('close', () => {
        done();
      });

      ws.on('error', (error) => {
        done(error);
      });
    });
  });

  describe('WebSocket Messages', () => {
    it('should handle ws:req message and return worldstate data', (done) => {
      const server = app.getHttpServer();
      const address = server.address();
      const port = typeof address === 'string' ? 3000 : address?.port || 3000;

      const ws = new WebSocket(`ws://localhost:${port}/socket`);
      let connectedReceived = false;

      ws.on('open', () => {
        // Wait for connected event before sending request
      });

      ws.on('message', (data) => {
        const message = JSON.parse(data.toString());

        if (message.event === 'connected' && !connectedReceived) {
          connectedReceived = true;
          // Send worldstate request
          ws.send(
            JSON.stringify({
              event: 'ws:req',
              packet: {
                platform: 'pc',
                language: 'en',
              },
            }),
          );
        } else if (message.event === 'ws:provide') {
          console.log(
            'Received ws:provide message:',
            JSON.stringify(message, null, 2),
          );
          expect(message.event).to.equal('ws:provide');
          expect(message.packet).to.be.an('object');
          expect(message.packet.platform).to.equal('pc');
          expect(message.packet.language).to.equal('en');
          expect(message.packet.ws).to.exist;
          expect(message.packet.ws).to.deep.equal(mockWorldStateData);
          ws.close();
          done();
        }
      });

      ws.on('error', (error) => {
        done(error);
      });
    });

    it('should handle ws:req with missing platform/language', (done) => {
      const server = app.getHttpServer();
      const address = server.address();
      const port = typeof address === 'string' ? 3000 : address?.port || 3000;

      const ws = new WebSocket(`ws://localhost:${port}/socket`);
      let connectedReceived = false;

      ws.on('open', () => {
        // Wait for connected event before sending request
      });

      ws.on('message', (data) => {
        const message = JSON.parse(data.toString());

        if (message.event === 'connected' && !connectedReceived) {
          connectedReceived = true;
          // Send request without platform/language
          ws.send(
            JSON.stringify({
              event: 'ws:req',
              packet: {},
            }),
          );
        } else if (message.event === 'ws:provide') {
          expect(message.event).to.equal('ws:provide');
          expect(message.packet).to.be.an('object');
          expect(message.packet.code).to.equal(500);
          expect(message.packet.message).to.be.a('string');
          ws.close();
          done();
        }
      });

      ws.on('error', (error) => {
        done(error);
      });
    });

    it('should handle twitter message request', (done) => {
      const server = app.getHttpServer();
      const address = server.address();
      const port = typeof address === 'string' ? 3000 : address?.port || 3000;

      const ws = new WebSocket(`ws://localhost:${port}/socket`);
      let connectedReceived = false;

      ws.on('open', () => {
        // Wait for connected event before sending request
      });

      ws.on('message', (data) => {
        const message = JSON.parse(data.toString());

        if (message.event === 'connected' && !connectedReceived) {
          connectedReceived = true;
          // Send twitter request
          ws.send(
            JSON.stringify({
              event: 'twitter',
            }),
          );
        } else if (message.event === 'twitter:provide') {
          expect(message.event).to.equal('twitter:provide');
          expect(message.packet).to.exist;
          expect(message.packet).to.deep.equal(mockTwitterData);
          ws.close();
          done();
        }
      });

      ws.on('error', (error) => {
        done(error);
      });
    });

    it('should handle rss message request', (done) => {
      const server = app.getHttpServer();
      const address = server.address();
      const port = typeof address === 'string' ? 3000 : address?.port || 3000;

      const ws = new WebSocket(`ws://localhost:${port}/socket`);
      let connectedReceived = false;

      ws.on('open', () => {
        // Wait for connected event before sending request
      });

      ws.on('message', (data) => {
        const message = JSON.parse(data.toString());

        if (message.event === 'connected' && !connectedReceived) {
          connectedReceived = true;
          // Send rss request
          ws.send(
            JSON.stringify({
              event: 'rss',
            }),
          );
        } else if (message.event === 'rss:provide') {
          expect(message.event).to.equal('rss:provide');
          expect(message.packet).to.exist;
          expect(message.packet).to.deep.equal(mockRssData);
          ws.close();
          done();
        }
      });

      ws.on('error', (error) => {
        done(error);
      });
    });
  });

  describe('Heartbeat/Ping-Pong', () => {
    it('should respond to ping with pong', (done) => {
      const server = app.getHttpServer();
      const address = server.address();
      const port = typeof address === 'string' ? 3000 : address?.port || 3000;

      const ws = new WebSocket(`ws://localhost:${port}/socket`);

      ws.on('open', () => {
        // Send ping
        ws.ping();
      });

      ws.on('pong', () => {
        // Received pong response
        ws.close();
        done();
      });

      ws.on('error', (error) => {
        done(error);
      });
    });
  });

  describe('Event Broadcasting', () => {
    it('should broadcast tweet events to all connected clients', (done) => {
      const server = app.getHttpServer();
      const address = server.address();
      const port = typeof address === 'string' ? 3000 : address?.port || 3000;

      const ws = new WebSocket(`ws://localhost:${port}/socket`);
      let connectedReceived = false;

      const testTweet = {
        id: 'broadcast-test-tweet',
        text: 'Broadcast test',
      };

      ws.on('open', () => {
        // Wait for connected event
      });

      ws.on('message', (data) => {
        const message = JSON.parse(data.toString());

        if (message.event === 'connected' && !connectedReceived) {
          connectedReceived = true;
          // Emit a tweet event from the mock service
          setTimeout(() => {
            mockWorldStateService.emitTweet(testTweet);
          }, 100);
        } else if (message.event === 'tweet') {
          expect(message.event).to.equal('tweet');
          expect(message.packet).to.deep.equal(testTweet);
          ws.close();
          done();
        }
      });

      ws.on('error', (error) => {
        done(error);
      });
    });

    it('should broadcast rss events to all connected clients', (done) => {
      const server = app.getHttpServer();
      const address = server.address();
      const port = typeof address === 'string' ? 3000 : address?.port || 3000;

      const ws = new WebSocket(`ws://localhost:${port}/socket`);
      let connectedReceived = false;

      const testRss = {
        title: 'Broadcast RSS test',
        link: 'https://example.com/broadcast',
      };

      ws.on('open', () => {
        // Wait for connected event
      });

      ws.on('message', (data) => {
        const message = JSON.parse(data.toString());

        if (message.event === 'connected' && !connectedReceived) {
          connectedReceived = true;
          // Emit an RSS event from the mock service
          setTimeout(() => {
            mockWorldStateService.emitRss(testRss);
          }, 100);
        } else if (message.event === 'rss') {
          expect(message.event).to.equal('rss');
          expect(message.packet).to.deep.equal(testRss);
          ws.close();
          done();
        }
      });

      ws.on('error', (error) => {
        done(error);
      });
    });

    it('should broadcast ws:update:event as both ws:event and specific key', (done) => {
      const server = app.getHttpServer();
      const address = server.address();
      const port = typeof address === 'string' ? 3000 : address?.port || 3000;

      const ws = new WebSocket(`ws://localhost:${port}/socket`);
      let connectedReceived = false;
      let wsEventReceived = false;

      const testEvent = {
        key: 'alerts',
        data: { id: 'test-alert' },
      };

      ws.on('open', () => {
        // Wait for connected event
      });

      ws.on('message', (data) => {
        const message = JSON.parse(data.toString());

        if (message.event === 'connected' && !connectedReceived) {
          connectedReceived = true;
          // Emit a ws:update:event from the mock service
          setTimeout(() => {
            mockWorldStateService.emitWsUpdateEvent(testEvent);
          }, 100);
        } else if (message.event === 'ws:event') {
          expect(message.packet).to.deep.equal(testEvent);
          wsEventReceived = true;
        } else if (message.event === 'alerts' && wsEventReceived) {
          expect(message.packet).to.deep.equal(testEvent);
          ws.close();
          done();
        }
      });

      ws.on('error', (error) => {
        done(error);
      });
    });

    it('should broadcast ws:update:parsed as ws:update', (done) => {
      const server = app.getHttpServer();
      const address = server.address();
      const port = typeof address === 'string' ? 3000 : address?.port || 3000;

      const ws = new WebSocket(`ws://localhost:${port}/socket`);
      let connectedReceived = false;

      const testUpdate = {
        worldstate: mockWorldStateData,
        platform: 'pc',
      };

      ws.on('open', () => {
        // Wait for connected event
      });

      ws.on('message', (data) => {
        const message = JSON.parse(data.toString());

        if (message.event === 'connected' && !connectedReceived) {
          connectedReceived = true;
          // Emit a ws:update:parsed from the mock service
          setTimeout(() => {
            mockWorldStateService.emitWsUpdateParsed(testUpdate);
          }, 100);
        } else if (message.event === 'ws:update') {
          expect(message.event).to.equal('ws:update');
          expect(message.packet).to.deep.equal(testUpdate);
          ws.close();
          done();
        }
      });

      ws.on('error', (error) => {
        done(error);
      });
    });
  });
});
