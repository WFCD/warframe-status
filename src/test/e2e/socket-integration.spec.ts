import type { INestApplication } from '@nestjs/common';
import { expect, use } from 'chai';
import chaiHttp, { request } from 'chai-http';
import { WebSocket } from 'ws';
import { getApp } from '../hooks/setup.hook';

use(chaiHttp);

describe('/socket', () => {
  let nestApp: INestApplication;

  before(() => {
    nestApp = getApp();
  });

  describe('WebSocket Connection', () => {
    it('should establish connection and receive connected event', (done) => {
      const server = nestApp.getHttpServer();
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
      const server = nestApp.getHttpServer();
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
    it('should handle ws:req message and return worldstate data', function (done) {
      // Skip if worldstate is not enabled
      if (process.env.USE_WORLDSTATE !== 'true') {
        this.skip();
      }

      const server = nestApp.getHttpServer();
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
          expect(message.event).to.equal('ws:provide');
          expect(message.packet).to.be.an('object');
          expect(message.packet.platform).to.equal('pc');
          expect(message.packet.language).to.equal('en');
          expect(message.packet.ws).to.exist;
          ws.close();
          done();
        }
      });

      ws.on('error', (error) => {
        done(error);
      });
    });

    it('should handle ws:req with missing platform/language', function (done) {
      // Skip if worldstate is not enabled
      if (process.env.USE_WORLDSTATE !== 'true') {
        this.skip();
      }

      const server = nestApp.getHttpServer();
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

    it('should handle twitter message request', function (done) {
      // Skip if worldstate is not enabled
      if (process.env.USE_WORLDSTATE !== 'true') {
        this.skip();
      }

      const server = nestApp.getHttpServer();
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
        } else if (
          message.event === 'twitter:provide' ||
          message.status === 400
        ) {
          // Twitter data or error response
          if (message.event === 'twitter:provide') {
            expect(message.event).to.equal('twitter:provide');
            expect(message.packet).to.exist;
          } else {
            // Twitter not active
            expect(message.status).to.equal(400);
          }
          ws.close();
          done();
        }
      });

      ws.on('error', (error) => {
        done(error);
      });
    });

    it('should handle rss message request', function (done) {
      // Skip if worldstate is not enabled
      if (process.env.USE_WORLDSTATE !== 'true') {
        this.skip();
      }

      const server = nestApp.getHttpServer();
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
        } else if (message.event === 'rss:provide' || message.status === 400) {
          // RSS data or error response
          if (message.event === 'rss:provide') {
            expect(message.event).to.equal('rss:provide');
            expect(message.packet).to.exist;
          } else {
            // RSS not available
            expect(message.status).to.equal(400);
          }
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
      const server = nestApp.getHttpServer();
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

    it('should receive ping from server', function (done) {
      this.timeout(35000); // Heartbeat is sent every 30 seconds

      const server = nestApp.getHttpServer();
      const address = server.address();
      const port = typeof address === 'string' ? 3000 : address?.port || 3000;

      const ws = new WebSocket(`ws://localhost:${port}/socket`);

      ws.on('ping', () => {
        // Received ping from server
        ws.close();
        done();
      });

      ws.on('error', (error) => {
        done(error);
      });
    });
  });
});
