import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { create } from 'flat-cache';

import Logger from '../logger.js';
import { TWO_DAYS } from '../times.js';

const CLIENT_ID = 'kimne78kx3ncx6brgo4mv6wki5h1ko'; // twitch's client id
const WF_ARSENAL_ID = 'ud1zj704c0eb1s553jbkayvqxjft97';
const TWITCH_CHANNEL_ID = '89104719'; // tobitenno

const dirName = dirname(fileURLToPath(import.meta.url));

export default class TwitchCache {
  static #cache = create({ cacheId: '.twitch', cacheDir: resolve(dirName, '../../../') });

  static async #hydrate(logger = Logger('TWITCH')) {
    if (
      CLIENT_ID &&
      Date.now() - (this.#cache.getKey('last_updt') || 0) >= TWO_DAYS &&
      this.#cache.getKey('token') !== 'unset'
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
        this.#cache.setKey('token', raw);
        this.#cache.setKey('last_updt', Date.now());
        this.#cache.save(true);
      } catch (e) {
        logger.error('Cannot hydrate Twitch token');
      }
    }
  }

  static async populate(logger = Logger('TWITCH')) {
    return this.#hydrate(logger);
  }
}
