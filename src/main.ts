import 'reflect-metadata';
import cluster from 'node:cluster';
import os from 'node:os';
import { AppModule } from '@nest/app.module';
import { NestFactory } from '@nestjs/core';
import type { NestExpressApplication } from '@nestjs/platform-express';
import { WsAdapter } from '@nestjs/platform-ws';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { LoggerService, LogScope } from '@services/logger.service';
import * as yaml from 'js-yaml';

// Create global logger for main.ts (replaces console.*)
const mainLogger = new LoggerService();
mainLogger.setContext(LogScope.PROC);

async function bootstrap(listenHttp = true) {
  // Create NestJS-specific logger instance
  const nestLogger = new LoggerService();
  nestLogger.setContext(LogScope.NEST);

  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    logger: nestLogger, // Use Winston for NestJS internal logs
    bufferLogs: true, // Buffer early logs until logger is ready
  });

  // Use WebSocket adapter
  app.useWebSocketAdapter(new WsAdapter(app));

  // Setup OpenAPI documentation
  const config = new DocumentBuilder()
    .setTitle('Warframe Status API')
    .setDescription(
      'API for retrieving Warframe worldstate data, items, profiles, and more',
    )
    .setVersion('2.6.44')
    .setContact(
      'Warframe Community Developers',
      'https://github.com/WFCD/warframe-status',
      'tobiah@wfcd.dev',
    )
    .setLicense('Apache-2.0', 'https://www.apache.org/licenses/LICENSE-2.0')
    .addServer('https://api.warframestat.us', 'Production')
    .addServer('http://localhost:3000', 'Local Development')
    .addTag('system', 'System health and status endpoints')
    .addTag(
      'worldstate',
      'Warframe worldstate data - live game events, alerts, invasions, and more',
    )
    .addTag(
      'items',
      'Warframe items database - weapons, warframes, mods, and equipment',
    )
    .addTag('drops', 'Drop tables and loot information')
    .addTag('rivens', 'Riven mod disposition and pricing statistics')
    .addTag('wfinfo', 'WFInfo overlay application integration endpoints')
    .addTag('pricecheck', 'Warframe.market price checking integration')
    .addTag('profile', 'Player profile parsing and statistics')
    .addTag('social', 'Social media feeds - Twitter and RSS')
    .addTag(
      'synthTargets',
      'Sanctuary synthesis targets and other static Warframe data',
    )
    .addTag(
      'data',
      'Static Warframe data - arcanes, tutorials, conclave, sol nodes, and more',
    )
    .build();

  const document = SwaggerModule.createDocument(app, config);

  // Serve OpenAPI spec at /openapi.yaml
  app.getHttpAdapter().get('/openapi.yaml', (_req: any, res: any) => {
    const yamlDoc = yaml.dump(document, { skipInvalid: true });
    res.header('Content-Type', 'text/yaml');
    res.send(yamlDoc);
  });

  // Serve OpenAPI spec at /openapi.json
  app.getHttpAdapter().get('/openapi.json', (_req: any, res: any) => {
    res.header('Content-Type', 'application/json');
    res.send(document);
  });

  // Get configuration from environment
  // For development: bind to 0.0.0.0 (all interfaces) so localhost works
  // For production: can override with HOST or IP env vars
  const port = process.env.PORT || 3000;
  const host = process.env.HOST || process.env.IP || '0.0.0.0';

  // Enable graceful shutdown
  app.enableShutdownHooks();

  if (listenHttp) {
    await app.listen(port, host);
    const url = await app.getUrl();
    mainLogger.info(`Worker process ${process.pid} is listening on ${url}`);
  } else {
    // Initialize the app without listening (for cluster primary - hydration only)
    await app.init();
    mainLogger.info(
      `Primary process ${process.pid} initialized (hydration only, no HTTP listener)`,
    );
  }

  return app;
}

async function startCluster() {
  const cpus = Math.floor(os.cpus().length / 2);
  const useCluster = process.env.USE_CLUSTER === 'true';

  if (cluster.isPrimary && cpus > 2 && useCluster) {
    mainLogger.info(
      `Primary process ${process.pid} starting up with ${cpus} workers.`,
    );

    // In cluster mode, primary process runs the app for hydration only (no HTTP listener)
    // This matches Express behavior where cache hydration checks cluster.isPrimary
    await bootstrap(false); // false = don't listen on HTTP port

    for (let i = 0; i < cpus; i += 1) {
      cluster.fork();
    }

    cluster.on('exit', (worker, code, signal) => {
      mainLogger.warn(
        `Worker process ${worker.process.pid} died (code: ${code}, signal: ${signal}). Restarting...`,
      );
      cluster.fork();
    });

    // Handle IPC messages from workers (for cache coordination)
    cluster.on('message', (worker, message) => {
      if (message?.type === 'cache:update') {
        // Broadcast cache update to all other workers
        for (const id in cluster.workers) {
          const w = cluster.workers[id];
          if (w && w.id !== worker.id) {
            w.send(message);
          }
        }
      }
    });
  } else {
    // Worker process or single-process mode - listen on HTTP port
    await bootstrap(true); // true = listen on HTTP port
  }
}

// Start the application
startCluster().catch((err) => {
  mainLogger.error(`Error starting application: ${err.message}`, err.stack);
  process.exit(1);
});
