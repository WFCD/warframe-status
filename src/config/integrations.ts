import { envBool, envEnabled, envString } from '@nest/config/env-helpers';

export const USER_AGENT = envString('USER_AGENT', 'Node.js Fetch');

export const PRICECHECKS_ENABLED =
  envEnabled('PRICECHECKS_ENABLED', true) &&
  envString('DISABLE_PRICECHECKS') !== 'true';

/** Env var key — used when tests need to mutate process.env at runtime. */
export const PRICECHECKS_ENABLED_KEY = 'PRICECHECKS_ENABLED';

export const WFINFO_FILTERED_ITEMS = envString('WFINFO_FILTERED_ITEMS');
export const WFINFO_PRICES = envString('WFINFO_PRICES');

export const TWITTER_ACTIVE = envBool('TWITTER_ACTIVE');
