import { fromString } from '@nest/config/log-level';

export const WORLDSTATE_INIT_TIMEOUT = parseInt(
  process.env.WORLDSTATE_INIT_TIMEOUT ?? '30000',
  10,
);

// Feature flags - default to enabled for passive configuration
// Users can explicitly disable by setting USE_WORLDSTATE=false or removing SOCKET from FEATURES
export const USE_WORLDSTATE = process?.env?.USE_WORLDSTATE !== 'false';
export const FEATURES = process.env.FEATURES?.split(',') || ['SOCKET']; // SOCKET enabled by default
export const USE_SOCKET = FEATURES.includes('SOCKET');

export const LOG_LEVEL = fromString(process.env.LOG_LEVEL ?? 'error');
