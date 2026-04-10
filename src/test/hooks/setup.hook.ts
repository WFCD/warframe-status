import { AppModule } from '@nest/app.module';
import type { NestApplication } from '@nestjs/core';
import { WsAdapter } from '@nestjs/platform-ws';
import type { TestingModule } from '@nestjs/testing';
import { Test } from '@nestjs/testing';
import * as chai from 'chai';
import chaiHttp, { request } from 'chai-http';

chai.use(chaiHttp);

let app: NestApplication;
let moduleFixture: TestingModule;

/**
 * Get the NestJS app instance for testing
 */
export function getApp(): NestApplication {
  if (!app) {
    throw new Error('App not initialized. Call setupApp() first.');
  }
  return app;
}

/**
 * Create a request helper that uses chai-http
 */
export function req(path: string) {
  const application = getApp();
  return request.execute(application.getHttpServer()).get(path);
}

/**
 * Setup the NestJS application for testing
 * This should be called in a beforeAll hook
 */
export async function setupApp(): Promise<NestApplication> {
  moduleFixture = await Test.createTestingModule({
    imports: [AppModule],
  }).compile();

  app = moduleFixture.createNestApplication();

  // Use WebSocket adapter
  app.useWebSocketAdapter(new WsAdapter(app));

  // Match the same configuration as the main app
  await app.init();

  // Start listening on a random port for WebSocket tests
  await app.listen(0); // Port 0 = random available port

  // Wait for cache to populate (items cache takes ~75 seconds)
  // In tests, we should have pre-populated cache files
  await new Promise((resolve) => setTimeout(resolve, 2000));

  return app;
}

/**
 * Teardown the NestJS application after testing
 * This should be called in an afterAll hook
 */
export async function teardownApp(): Promise<void> {
  if (app) {
    await app.close();
  }
  if (moduleFixture) {
    await moduleFixture.close();
  }
}

/**
 * Mocha hooks for global setup/teardown
 */
export const mochaHooks = {
  async beforeAll(this: Mocha.Context) {
    this.timeout(120000); // 2 minutes for cache population
    await setupApp();
  },
  async afterAll() {
    await teardownApp();
  },
};
