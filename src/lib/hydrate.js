import flatCache from 'flat-cache';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import Logger from './logger.js';
import { wfInfo, build } from './settings.js';
import ItemsCache from './caches/Items.js';
import RivensCache from './caches/Rivens.js';
import DropsCache from './caches/Drops.js';

const { filteredItems: filteredItemsSrc, prices: pricesSrc } = wfInfo;

const dirName = dirname(fileURLToPath(import.meta.url));

const TWO_HOURS = 7200000;
const TWO_DAYS = 172800000;

// TODO: Eventually migrate to a standalone cache class
const hydrateWfInfo = async (logger) => {
  const start = Date.now();
  // WF Info caches
  const wfInfoCache = flatCache.load('.wfinfo', resolve(dirName, '../../'));
  if (Date.now() - (wfInfoCache.getKey('last_updt') || 0) >= TWO_HOURS / 2) {
    if (filteredItemsSrc) {
      const itemsRes = await fetch(filteredItemsSrc);
      const itemsRaw = await itemsRes.text();
      try {
        const d = JSON.parse(itemsRaw);
        wfInfoCache.setKey('filteredItems', d);
      } catch (e) {
        logger.error(`Failed to update wfinfo filtered items`, e);
      }
    }
    if (pricesSrc) {
      const pricesRes = await fetch(pricesSrc);
      const pricesRaw = await pricesRes.text();
      try {
        const d = JSON.parse(pricesRaw);
        wfInfoCache.setKey('prices', d);
      } catch (e) {
        logger.error(`Failed to update wfinfo Prices`, e);
      }
    }
    wfInfoCache.setKey('last_updt', Date.now());
    wfInfoCache.save(true);

    const end = Date.now();
    logger.info(`WFInfo Hydration complete in ${end - start}ms`);
  }
};

// TODO: Eventually migrate to a standalone cache class
const hydrateTwitch = async (logger) => {
  // Twitch extension token cache
  const twitchCache = flatCache.load('.twitch', resolve(dirName, '../../'));
  const CLIENT_ID = 'kimne78kx3ncx6brgo4mv6wki5h1ko'; // twitch's client id
  const WF_ARSENAL_ID = 'ud1zj704c0eb1s553jbkayvqxjft97';
  const TWITCH_CHANNEL_ID = '89104719'; // tobitenno
  if (
    CLIENT_ID &&
    Date.now() - (twitchCache.getKey('last_updt') || 0) >= TWO_DAYS &&
    twitchCache.getKey('token') !== 'unset'
  ) {
    try {
      let raw = await fetch(`https://gql.twitch.tv/gql`, {
        method: 'POST',
        headers: {
          'client-id': CLIENT_ID,
        },
        body: `[{"operationName":"ExtensionsForChannel","variables":{"channelID":"${TWITCH_CHANNEL_ID}"},"extensions":{"persistedQuery":{"version":1,"sha256Hash":"d52085e5b03d1fc3534aa49de8f5128b2ee0f4e700f79bf3875dcb1c90947ac3"}}}]`,
      }).then((d) => d.json());
      raw = raw?.[0]?.data?.user?.channel?.selfInstalledExtensions?.find((s) => {
        return s?.token?.extensionID === WF_ARSENAL_ID;
      })?.token?.jwt;
      raw = raw || 'unset';
      twitchCache.setKey('token', raw);
      twitchCache.setKey('last_updt', Date.now());
      twitchCache.save(true);
    } catch (e) {
      logger.error('Cannot hydrate Twitch token');
    }
  }
};

const hydrate = async () => {
  const logger = Logger('HYDRATE');
  logger.level = 'info';
  await ItemsCache.populate();
  await DropsCache.populate();
  await RivensCache.populate();
  await hydrateWfInfo(logger);
  await hydrateTwitch(logger);
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
