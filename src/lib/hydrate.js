'use strict';

const Items = require('warframe-items');
const data = require('warframe-worldstate-data');
const flatCache = require('flat-cache');
const path = require('path');
const Logger = require('./logger');

const caches = ['weapons', 'warframes', 'items', 'mods'];
const i18nOnObject = true;
const FOUR_HOURS = 14400000;

const makeLanguageCache = (language) => {
  const base = ({
    weapons: new Items({
      category: ['Primary', 'Secondary', 'Melee', 'Arch-Melee', 'Arch-Gun'],
      i18n: language,
      i18nOnObject,
    }),
    warframes: new Items({
      category: ['Warframes', 'Archwing'],
      i18n: language,
      i18nOnObject,
    }),
    items: new Items({
      i18n: language,
      i18nOnObject,
    }),
    mods: new Items({
      category: ['Mods'],
      i18n: language,
      i18nOnObject,
    }),
  });
  const merged = {};
  caches.forEach((cacheType) => {
    const subCache = base[cacheType];
    merged[cacheType] = [...subCache].map((item) => {
      let itemClone = { ...item };
      if (language !== 'en' && itemClone.i18n && itemClone.i18n[language]) {
        itemClone = {
          ...itemClone,
          ...itemClone.i18n[language],
        };
      }
      delete itemClone.i18n;
      return itemClone;
    });
  });
  return merged;
};

const hydrate = () => {
  const cache = flatCache.load('.items', path.resolve(__dirname, '../../'));
  if ((Date.now() - cache.getKey('last_updt')) < (FOUR_HOURS / 2)) {
    return; // no need to hydrate
  }
  data.locales.forEach((language) => {
    const cacheForLang = makeLanguageCache(language);
    caches.forEach((cacheType) => {
      cache.setKey(`${language}-${cacheType}`, cacheForLang[cacheType]);
    });
  });
  cache.setKey('last_updt', Date.now());
  cache.save(true);
};

if (process.env.BUILD && process.env.BUILD.trim() === 'build') {
  const logger = Logger('BUILD');
  logger.level = 'info';
  try {
    const start = Date.now();
    hydrate();
    const end = Date.now();
    logger.info(`Hydration complete in ${end - start}ms`);
  } catch (e) {
    logger.error(e);
  }
} else {
  module.exports = hydrate;
}
