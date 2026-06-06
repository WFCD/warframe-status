/** Default process.env values applied before the test suite boots. */
export const TEST_ENV_DEFAULTS: Record<string, string> = {
  USE_WORLDSTATE: 'true',
  FEATURES: 'worldstate,SOCKET',
  WS_EMITTER_FEATURES: 'rss,rivens,worldstate',
  NODE_ENV: 'test',
  LOG_LEVEL: 'error',
  WORLDSTATE_INIT_TIMEOUT: '120000',
  WORLDSTATE_CRON: '*/30 * * * * *',
};
