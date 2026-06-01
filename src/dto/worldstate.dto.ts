import { ApiProperty } from '@nestjs/swagger';
import {
  AlertDto,
  CambionCycleDto,
  CetusCycleDto,
  ConstructionProgressDto,
  DailyDealDto,
  DarkSectorDto,
  DuviriCycleDto,
  EarthCycleDto,
  ExternalMissionDto,
  FissureDto,
  FlashSaleDto,
  GlobalUpgradeDto,
  InvasionDto,
  KuvaDto,
  NewsDto,
  NightwaveDto,
  PersistentEnemyDto,
  SentientOutpostDto,
  SimarisDto,
  SortieDto,
  SteelPathOfferingsDto,
  SyndicateMissionDto,
  VallisCycleDto,
  VoidTraderDto,
  WorldEventDto,
  ZarimanCycleDto,
} from '@dto/worldstate-generated';

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
    type: [AlertDto],
    required: false,
  })
  alerts?: AlertDto[];

  @ApiProperty({
    description: 'Arbitration mission data',
    type: ExternalMissionDto,
    required: false,
  })
  arbitration?: ExternalMissionDto;

  @ApiProperty({
    description: 'Cambion Drift cycle (Day/Fass or Night/Vome)',
    type: CambionCycleDto,
    required: false,
  })
  cambionCycle?: CambionCycleDto;

  @ApiProperty({
    description: 'Cetus cycle (Day or Night)',
    type: CetusCycleDto,
    required: false,
  })
  cetusCycle?: CetusCycleDto;

  @ApiProperty({
    description: 'Construction progress data',
    type: ConstructionProgressDto,
    required: false,
  })
  constructionProgress?: ConstructionProgressDto;

  @ApiProperty({
    description: 'Daily deals from Darvo',
    type: [DailyDealDto],
    required: false,
  })
  dailyDeals?: DailyDealDto[];

  @ApiProperty({
    description: 'Dark sector conflicts',
    type: [DarkSectorDto],
    required: false,
  })
  darkSectors?: DarkSectorDto[];

  @ApiProperty({
    description: 'Duviri cycle information',
    type: DuviriCycleDto,
    required: false,
  })
  duviriCycle?: DuviriCycleDto;

  @ApiProperty({
    description: 'Earth cycle (Day or Night)',
    type: EarthCycleDto,
    required: false,
  })
  earthCycle?: EarthCycleDto;

  @ApiProperty({
    description: 'Active events',
    type: [WorldEventDto],
    required: false,
  })
  events?: WorldEventDto[];

  @ApiProperty({
    description: 'Active void fissures',
    type: [FissureDto],
    required: false,
  })
  fissures?: FissureDto[];

  @ApiProperty({
    description: 'Flash sales',
    type: [FlashSaleDto],
    required: false,
  })
  flashSales?: FlashSaleDto[];

  @ApiProperty({
    description: 'Global upgrades/boosters',
    type: [GlobalUpgradeDto],
    required: false,
  })
  globalUpgrades?: GlobalUpgradeDto[];

  @ApiProperty({
    description: 'Active invasions',
    type: [InvasionDto],
    required: false,
  })
  invasions?: InvasionDto[];

  @ApiProperty({
    description: 'Kuva missions',
    type: [KuvaDto],
    required: false,
  })
  kuva?: KuvaDto[];

  @ApiProperty({
    description: 'Nightwave season data',
    type: NightwaveDto,
    required: false,
  })
  nightwave?: NightwaveDto;

  @ApiProperty({
    description: 'News items',
    type: [NewsDto],
    required: false,
  })
  news?: NewsDto[];

  @ApiProperty({
    description: 'Persistent enemies (Liches, Sisters)',
    type: [PersistentEnemyDto],
    required: false,
  })
  persistentEnemies?: PersistentEnemyDto[];

  @ApiProperty({
    description: 'Sentient anomaly outpost',
    type: SentientOutpostDto,
    required: false,
  })
  sentientOutposts?: SentientOutpostDto;

  @ApiProperty({
    description: 'Sanctuary synthesis targets',
    type: SimarisDto,
    required: false,
  })
  simaris?: SimarisDto;

  @ApiProperty({
    description: 'Daily sortie missions',
    type: SortieDto,
    required: false,
  })
  sortie?: SortieDto;

  @ApiProperty({
    description: 'Steel Path offerings',
    type: SteelPathOfferingsDto,
    required: false,
  })
  steelPath?: SteelPathOfferingsDto;

  @ApiProperty({
    description: 'Syndicate missions',
    type: [SyndicateMissionDto],
    required: false,
  })
  syndicateMissions?: SyndicateMissionDto[];

  @ApiProperty({
    description: 'Orb Vallis cycle (Warm or Cold)',
    type: VallisCycleDto,
    required: false,
  })
  vallisCycle?: VallisCycleDto;

  @ApiProperty({
    description: "Void trader (Baro Ki'Teer) data",
    type: VoidTraderDto,
    required: false,
  })
  voidTrader?: VoidTraderDto;

  @ApiProperty({
    description: 'Zariman cycle',
    type: ZarimanCycleDto,
    required: false,
  })
  zarimanCycle?: ZarimanCycleDto;
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
