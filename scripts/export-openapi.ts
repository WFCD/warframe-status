#!/usr/bin/env tsx
/**
 * Export the NestJS OpenAPI document for Redocly bundling and docs deployment.
 */

import 'reflect-metadata';
import { mkdirSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { AppModule } from '../src/app.module.ts';
import { setupOpenApi } from '../src/config/openapi-document.ts';
import type { NestApplication } from '@nestjs/core';
import { WsAdapter } from '@nestjs/platform-ws';
import { Test } from '@nestjs/testing';
import { WorldStateService } from '../src/services/worldstate.service.ts';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const outputPath = path.join(__dirname, '../docs/openapi/openapi.json');

const worldStateServiceStub = {
  onModuleInit: async () => {},
  getWorldstate: () => undefined,
  getTwitter: async () => [],
  getRss: () => [],
  getEmitter: () => undefined,
};

async function main(): Promise<void> {
  const moduleFixture = await Test.createTestingModule({
    imports: [AppModule],
  })
    .overrideProvider(WorldStateService)
    .useValue(worldStateServiceStub)
    .compile();

  const app = moduleFixture.createNestApplication<NestApplication>();
  app.useWebSocketAdapter(new WsAdapter(app));
  await app.init();

  const document = setupOpenApi(app);

  mkdirSync(path.dirname(outputPath), { recursive: true });
  writeFileSync(outputPath, `${JSON.stringify(document, null, 2)}\n`, 'utf-8');
  console.log(`Wrote ${outputPath}`);

  await app.close();
  await moduleFixture.close();
}

main().catch((error) => {
  console.error('Failed to export OpenAPI document:', error);
  process.exit(1);
});
