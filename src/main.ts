import 'reflect-metadata';
import cluster from 'node:cluster';
import os from 'node:os';
import { AppModule } from '@nest/app.module';
import { HOST, LOG_LEVEL, PORT, USE_CLUSTER } from '@nest/config/env';
import { setupOpenApi } from '@nest/config/openapi-document';
import { NestFactory } from '@nestjs/core';
import type { NestExpressApplication } from '@nestjs/platform-express';
import { WsAdapter } from '@nestjs/platform-ws';
import { LoggerService, LogScope } from '@services/logger.service';

// Create global logger for main.ts (replaces console.*)
const mainLogger = new LoggerService();
mainLogger.setContext(LogScope.PROC);
mainLogger.setLevel(LOG_LEVEL);

async function bootstrap(listenHttp = true) {
  // Create NestJS-specific logger instance
  const nestLogger = new LoggerService();
  nestLogger.setContext(LogScope.NEST);
  nestLogger.setLevel(LOG_LEVEL);

  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    logger: nestLogger, // Use Winston for NestJS internal logs
    bufferLogs: true, // Buffer early logs until logger is ready
  });

  // Use WebSocket adapter
  app.useWebSocketAdapter(new WsAdapter(app));

  // Setup OpenAPI documentation
  setupOpenApi(app);

  // Get configuration from environment
  // For development: bind to 0.0.0.0 (all interfaces) so localhost works
  // For production: can override with HOST or IP env vars
  const port = PORT;
  const host = HOST;

  // Enable graceful shutdown
  app.enableShutdownHooks();

  if (listenHttp) {
    await app.listen(port, host);
    const url = await app.getUrl();
    mainLogger.info(
      `Worker process ${process.pid} is listening on ${url}`,
      true,
    );
  } else {
    // Initialize the app without listening (for cluster primary - hydration only)
    await app.init();
    mainLogger.info(
      `Primary process ${process.pid} initialized (hydration only, no HTTP listener)`,
      true,
    );
  }

  return app;
}

async function startCluster() {
  const cpus = Math.floor(os.cpus().length / 2);
  const useCluster = USE_CLUSTER;

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
