// Environment setup for tests
// This file is loaded before any other test files
// Set environment variables directly (before any imports)
process.env.USE_WORLDSTATE = 'true';
process.env.FEATURES = 'worldstate,SOCKET';
process.env.WS_EMITTER_FEATURES = 'rss,rivens,worldstate';
process.env.NODE_ENV = 'test';
process.env.LOG_LEVEL = 'error';
// Speed up worldstate initialization for tests
process.env.WORLDSTATE_INIT_TIMEOUT = '30000'; // 30 seconds instead of 60
// Speed up worldstate updates for tests (default is every 5 minutes)
process.env.WORLDSTATE_CRON = '*/30 * * * * *'; // Update every 30 seconds instead of 5 minutes
