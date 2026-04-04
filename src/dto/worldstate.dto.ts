import { ApiProperty } from '@nestjs/swagger';
// Import parser classes directly - they already have @ApiProperty decorators
import {
  Alert,
  CambionCycle,
  CetusCycle,
  ConstructionProgress,
  DailyDeal,
  DarkSector,
  DuviriCycle,
  EarthCycle,
  ExternalMission,
  Fissure,
  FlashSale,
  GlobalUpgrade,
  Invasion,
  Kuva,
  News,
  Nightwave,
  PersistentEnemy,
  SentientOutpost,
  Simaris,
  Sortie,
  SteelPathOfferings,
  SyndicateMission,
  VallisCycle,
  VoidTrader,
  WorldEvent,
  ZarimanCycle,
} from 'warframe-worldstate-parser';

/**
 * WorldState response - contains all current game state data
 * Uses auto-generated DTOs from warframe-worldstate-parser
 */
export class WorldStateDto {
  @ApiProperty({
    description: 'Timestamp of worldstate update',
    type: Number,
  })
  timestamp!: number;

  @ApiProperty({
    description: 'Active alerts',
    type: [Alert],
    required: false,
  })
  alerts?: Alert[];

  @ApiProperty({
    description: 'Arbitration mission data',
    type: ExternalMission,
    required: false,
  })
  arbitration?: ExternalMission;

  @ApiProperty({
    description: 'Cambion Drift cycle (Day/Fass or Night/Vome)',
    type: CambionCycle,
    required: false,
  })
  cambionCycle?: CambionCycle;

  @ApiProperty({
    description: 'Cetus cycle (Day or Night)',
    type: CetusCycle,
    required: false,
  })
  cetusCycle?: CetusCycle;

  @ApiProperty({
    description: 'Construction progress data',
    type: ConstructionProgress,
    required: false,
  })
  constructionProgress?: ConstructionProgress;

  @ApiProperty({
    description: 'Daily deals from Darvo',
    type: [DailyDeal],
    required: false,
  })
  dailyDeals?: DailyDeal[];

  @ApiProperty({
    description: 'Dark sector conflicts',
    type: [DarkSector],
    required: false,
  })
  darkSectors?: DarkSector[];

  @ApiProperty({
    description: 'Duviri cycle information',
    type: DuviriCycle,
    required: false,
  })
  duviriCycle?: DuviriCycle;

  @ApiProperty({
    description: 'Earth cycle (Day or Night)',
    type: EarthCycle,
    required: false,
  })
  earthCycle?: EarthCycle;

  @ApiProperty({
    description: 'Active events',
    type: [WorldEvent],
    required: false,
  })
  events?: WorldEvent[];

  @ApiProperty({
    description: 'Active void fissures',
    type: [Fissure],
    required: false,
  })
  fissures?: Fissure[];

  @ApiProperty({
    description: 'Flash sales',
    type: [FlashSale],
    required: false,
  })
  flashSales?: FlashSale[];

  @ApiProperty({
    description: 'Global upgrades/boosters',
    type: [GlobalUpgrade],
    required: false,
  })
  globalUpgrades?: GlobalUpgrade[];

  @ApiProperty({
    description: 'Active invasions',
    type: [Invasion],
    required: false,
  })
  invasions?: Invasion[];

  @ApiProperty({
    description: 'Kuva missions',
    type: [Kuva],
    required: false,
  })
  kuva?: Kuva[];

  @ApiProperty({
    description: 'Nightwave season data',
    type: Nightwave,
    required: false,
  })
  nightwave?: Nightwave;

  @ApiProperty({
    description: 'News items',
    type: [News],
    required: false,
  })
  news?: News[];

  @ApiProperty({
    description: 'Persistent enemies (Liches, Sisters)',
    type: [PersistentEnemy],
    required: false,
  })
  persistentEnemies?: PersistentEnemy[];

  @ApiProperty({
    description: 'Sentient anomaly outpost',
    type: SentientOutpost,
    required: false,
  })
  sentientOutposts?: SentientOutpost;

  @ApiProperty({
    description: 'Sanctuary synthesis targets',
    type: Simaris,
    required: false,
  })
  simaris?: Simaris;

  @ApiProperty({
    description: 'Daily sortie missions',
    type: Sortie,
    required: false,
  })
  sortie?: Sortie;

  @ApiProperty({
    description: 'Steel Path offerings',
    type: SteelPathOfferings,
    required: false,
  })
  steelPath?: SteelPathOfferings;

  @ApiProperty({
    description: 'Syndicate missions',
    type: [SyndicateMission],
    required: false,
  })
  syndicateMissions?: SyndicateMission[];

  @ApiProperty({
    description: 'Orb Vallis cycle (Warm or Cold)',
    type: VallisCycle,
    required: false,
  })
  vallisCycle?: VallisCycle;

  @ApiProperty({
    description: "Void trader (Baro Ki'Teer) data",
    type: VoidTrader,
    required: false,
  })
  voidTrader?: VoidTrader;

  @ApiProperty({
    description: 'Zariman cycle',
    type: ZarimanCycle,
    required: false,
  })
  zarimanCycle?: ZarimanCycle;
}

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
