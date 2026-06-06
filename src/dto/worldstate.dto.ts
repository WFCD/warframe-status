/**
 * WorldState response and route parameter types.
 *
 * WorldStateDto is generated from warframe-worldstate-parser (see worldstate-generated/).
 * Platform and language enums are maintained here for route/OpenAPI documentation.
 */
export { WorldStateDto } from '@dto/worldstate-generated/world-state.dto';

/**
 * Platform parameter - determines which platform's worldstate to retrieve
 */
export enum PlatformEnum {
  PC = 'pc',
  PS4 = 'ps4',
  PSN = 'psn',
  XB1 = 'xb1',
  SWI = 'swi',
  NS = 'ns',
}

/**
 * Language codes for localized worldstate data
 */
export enum LanguageEnum {
  DE = 'de',
  EN = 'en',
  ES = 'es',
  FR = 'fr',
  IT = 'it',
  KO = 'ko',
  PL = 'pl',
  PT = 'pt',
  RU = 'ru',
  ZH = 'zh',
  CS = 'cs',
  SR = 'sr',
  UK = 'uk',
}
