import * as Sentry from '@sentry/node';

import { release, sentry } from './settings.js';

if (sentry) {
  Sentry.init({
    dsn: sentry,
    release: `${release.name}@${release.version}`,
    tracePropagationTargets: ['api.warframestat.us'],
    sampleRate: 0.25,
  });
}
