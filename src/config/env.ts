import {
  envBool,
  envCsv,
  envEnabled,
  envInt,
  envString,
} from '@nest/config/env-helpers';
import { fromString } from '@nest/config/log-level';

export const NODE_ENV = envString('NODE_ENV', 'development');

export const PORT = envInt('PORT', 3000);
export const HOST =
  envString('HOST') ?? envString('HOSTNAME') ?? envString('IP') ?? '0.0.0.0';

export const USE_CLUSTER = envBool('USE_CLUSTER');

export const BUILD = envString('BUILD');
/** Exact match — blocks startup until hydration completes. */
export const FORCE_BUILD = BUILD?.trim() === 'build';
/** Prefix match — triggers cache prefill on module init. */
export const BUILD_CACHE_PREFILL = BUILD?.trim().startsWith('build') ?? false;

export const WORLDSTATE_INIT_TIMEOUT = envInt('WORLDSTATE_INIT_TIMEOUT', 30000);

/** Enabled unless USE_WORLDSTATE is explicitly "false". */
export const USE_WORLDSTATE = envEnabled('USE_WORLDSTATE', true);

/** True only when USE_WORLDSTATE is explicitly set to "true". */
export const USE_WORLDSTATE_EXPLICIT = envString('USE_WORLDSTATE') === 'true';

export const FEATURES = envCsv('FEATURES', ['SOCKET']);
export const USE_SOCKET = FEATURES.includes('SOCKET');

export const LOG_LEVEL = fromString(envString('LOG_LEVEL', 'error'));

export const SKIP_INTEGRATION = envBool('SKIP_INTEGRATION');
