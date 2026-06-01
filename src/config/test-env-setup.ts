/**
 * Side-effect module: apply test defaults to process.env.
 * Import this before any application modules in isolated test files.
 */
import { TEST_ENV_DEFAULTS } from '@nest/config/test-env-values';

for (const [key, value] of Object.entries(TEST_ENV_DEFAULTS)) {
  process.env[key] = value;
}
