import Logger from './logger.js';
import { build } from './settings.js';
import ItemsCache from './caches/Items.js';
import RivensCache from './caches/Rivens.js';
import DropsCache from './caches/Drops.js';
import WFInfoCache from './caches/WFInfo.js';
import TwitchCache from './caches/Twitch.js';

const hydrate = async () => {
  const logger = Logger('HYDRATE');
  logger.level = 'info';
  await ItemsCache.populate(logger);
  await DropsCache.populate(logger);
  await RivensCache.populate(logger);
  await WFInfoCache.populate(logger);
  await TwitchCache.populate(logger);
};

if (build) {
  const logger = Logger('BUILD');
  logger.level = 'info';
  try {
    const start = Date.now();
    await hydrate();
    const end = Date.now();
    logger.info(`Hydration complete in ${end - start}ms`);
    process.exit(0);
  } catch (e) {
    logger.error(e);
  }
}

export default hydrate;
