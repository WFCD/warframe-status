// Auto-generated file - DO NOT EDIT MANUALLY
// Generated from WorldStateDto source file
// Run: npm run generate:routes to regenerate
// Last generated: 2026-04-10T03:48:25.114Z

import { Controller, Get, Query, Req, Res } from '@nestjs/common';
import { ApiOperation, ApiQuery, ApiResponse, ApiTags } from '@nestjs/swagger';
import type { Request, Response } from 'express';
// Import all parser types for OpenAPI documentation
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
import { WorldstateBaseController } from './worldstate-base.controller';

/**
 * Generated controller with explicit routes for each worldstate field
 * Extends WorldstateBaseController to reuse shared getField() implementation
 *
 * Total fields: 27
 * Array fields (support filtering): alerts, dailyDeals, darkSectors, events, fissures, flashSales, globalUpgrades, invasions, kuva, news, persistentEnemies, syndicateMissions
 * Object fields: timestamp, arbitration, cambionCycle, cetusCycle, constructionProgress, duviriCycle, earthCycle, nightwave, sentientOutposts, simaris, sortie, steelPath, vallisCycle, voidTrader, zarimanCycle
 */
@Controller()
@ApiTags('worldstate')
export abstract class WorldstateFieldRoutesController extends WorldstateBaseController {
  /**
   * Get Timestamp of worldstate update
   * Route: GET /pc/timestamp
   */
  @Get('pc/timestamp')
  @ApiOperation({
    summary: 'Get Timestamp of worldstate update',
    description: 'Timestamp of worldstate update',
    operationId: 'getPcTimestamp',
  })
  @ApiResponse({
    status: 200,
    description: 'Timestamp retrieved successfully',
    type: Number,
  })
  @ApiResponse({
    status: 404,
    description: 'Field not present in worldstate',
  })
  async getPcTimestamp(
    @Query() query: Record<string, unknown>,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    return this.getField('timestamp', req, res, query);
  }

  /**
   * Get Active alerts
   * Route: GET /pc/alerts
   */
  @Get('pc/alerts')
  @ApiOperation({
    summary: 'Get Active alerts',
    description: 'Active alerts',
    operationId: 'getPcAlerts',
  })
  @ApiResponse({
    status: 200,
    description: 'Active alerts retrieved successfully',
    type: [Alert],
  })
  @ApiResponse({
    status: 404,
    description: 'Field not present in worldstate',
  })
  @ApiQuery({
    name: 'filter',
    required: false,
    description:
      'Filter results by field:value pairs, comma-separated (e.g., "active:true,tier:Lith")',
    example: 'active:true',
  })
  async getPcAlerts(
    @Query() query: Record<string, unknown>,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    return this.getField('alerts', req, res, query);
  }

  /**
   * Get Arbitration mission data
   * Route: GET /pc/arbitration
   */
  @Get('pc/arbitration')
  @ApiOperation({
    summary: 'Get Arbitration mission data',
    description: 'Arbitration mission data',
    operationId: 'getPcArbitration',
  })
  @ApiResponse({
    status: 200,
    description: 'Arbitration mission data retrieved successfully',
    type: ExternalMission,
  })
  @ApiResponse({
    status: 404,
    description: 'Field not present in worldstate',
  })
  async getPcArbitration(
    @Query() query: Record<string, unknown>,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    return this.getField('arbitration', req, res, query);
  }

  /**
   * Get Cambion Drift cycle (Day/Fass or Night/Vome)
   * Route: GET /pc/cambionCycle
   */
  @Get('pc/cambionCycle')
  @ApiOperation({
    summary: 'Get Cambion Drift cycle (Day/Fass or Night/Vome)',
    description: 'Cambion Drift cycle (Day/Fass or Night/Vome)',
    operationId: 'getPcCambionCycle',
  })
  @ApiResponse({
    status: 200,
    description:
      'Cambion Drift cycle (Day/Fass or Night/Vome) retrieved successfully',
    type: CambionCycle,
  })
  @ApiResponse({
    status: 404,
    description: 'Field not present in worldstate',
  })
  async getPcCambionCycle(
    @Query() query: Record<string, unknown>,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    return this.getField('cambionCycle', req, res, query);
  }

  /**
   * Get Cetus cycle (Day or Night)
   * Route: GET /pc/cetusCycle
   */
  @Get('pc/cetusCycle')
  @ApiOperation({
    summary: 'Get Cetus cycle (Day or Night)',
    description: 'Cetus cycle (Day or Night)',
    operationId: 'getPcCetusCycle',
  })
  @ApiResponse({
    status: 200,
    description: 'Cetus cycle (Day or Night) retrieved successfully',
    type: CetusCycle,
  })
  @ApiResponse({
    status: 404,
    description: 'Field not present in worldstate',
  })
  async getPcCetusCycle(
    @Query() query: Record<string, unknown>,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    return this.getField('cetusCycle', req, res, query);
  }

  /**
   * Get Construction progress data
   * Route: GET /pc/constructionProgress
   */
  @Get('pc/constructionProgress')
  @ApiOperation({
    summary: 'Get Construction progress data',
    description: 'Construction progress data',
    operationId: 'getPcConstructionProgress',
  })
  @ApiResponse({
    status: 200,
    description: 'Construction progress data retrieved successfully',
    type: ConstructionProgress,
  })
  @ApiResponse({
    status: 404,
    description: 'Field not present in worldstate',
  })
  async getPcConstructionProgress(
    @Query() query: Record<string, unknown>,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    return this.getField('constructionProgress', req, res, query);
  }

  /**
   * Get Daily deals from Darvo
   * Route: GET /pc/dailyDeals
   */
  @Get('pc/dailyDeals')
  @ApiOperation({
    summary: 'Get Daily deals from Darvo',
    description: 'Daily deals from Darvo',
    operationId: 'getPcDailyDeals',
  })
  @ApiResponse({
    status: 200,
    description: 'Daily deals from Darvo retrieved successfully',
    type: [DailyDeal],
  })
  @ApiResponse({
    status: 404,
    description: 'Field not present in worldstate',
  })
  @ApiQuery({
    name: 'filter',
    required: false,
    description:
      'Filter results by field:value pairs, comma-separated (e.g., "active:true,tier:Lith")',
    example: 'active:true',
  })
  async getPcDailyDeals(
    @Query() query: Record<string, unknown>,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    return this.getField('dailyDeals', req, res, query);
  }

  /**
   * Get Dark sector conflicts
   * Route: GET /pc/darkSectors
   */
  @Get('pc/darkSectors')
  @ApiOperation({
    summary: 'Get Dark sector conflicts',
    description: 'Dark sector conflicts',
    operationId: 'getPcDarkSectors',
  })
  @ApiResponse({
    status: 200,
    description: 'Dark sector conflicts retrieved successfully',
    type: [DarkSector],
  })
  @ApiResponse({
    status: 404,
    description: 'Field not present in worldstate',
  })
  @ApiQuery({
    name: 'filter',
    required: false,
    description:
      'Filter results by field:value pairs, comma-separated (e.g., "active:true,tier:Lith")',
    example: 'active:true',
  })
  async getPcDarkSectors(
    @Query() query: Record<string, unknown>,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    return this.getField('darkSectors', req, res, query);
  }

  /**
   * Get Duviri cycle information
   * Route: GET /pc/duviriCycle
   */
  @Get('pc/duviriCycle')
  @ApiOperation({
    summary: 'Get Duviri cycle information',
    description: 'Duviri cycle information',
    operationId: 'getPcDuviriCycle',
  })
  @ApiResponse({
    status: 200,
    description: 'Duviri cycle information retrieved successfully',
    type: DuviriCycle,
  })
  @ApiResponse({
    status: 404,
    description: 'Field not present in worldstate',
  })
  async getPcDuviriCycle(
    @Query() query: Record<string, unknown>,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    return this.getField('duviriCycle', req, res, query);
  }

  /**
   * Get Earth cycle (Day or Night)
   * Route: GET /pc/earthCycle
   */
  @Get('pc/earthCycle')
  @ApiOperation({
    summary: 'Get Earth cycle (Day or Night)',
    description: 'Earth cycle (Day or Night)',
    operationId: 'getPcEarthCycle',
  })
  @ApiResponse({
    status: 200,
    description: 'Earth cycle (Day or Night) retrieved successfully',
    type: EarthCycle,
  })
  @ApiResponse({
    status: 404,
    description: 'Field not present in worldstate',
  })
  async getPcEarthCycle(
    @Query() query: Record<string, unknown>,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    return this.getField('earthCycle', req, res, query);
  }

  /**
   * Get Active events
   * Route: GET /pc/events
   */
  @Get('pc/events')
  @ApiOperation({
    summary: 'Get Active events',
    description: 'Active events',
    operationId: 'getPcEvents',
  })
  @ApiResponse({
    status: 200,
    description: 'Active events retrieved successfully',
    type: [WorldEvent],
  })
  @ApiResponse({
    status: 404,
    description: 'Field not present in worldstate',
  })
  @ApiQuery({
    name: 'filter',
    required: false,
    description:
      'Filter results by field:value pairs, comma-separated (e.g., "active:true,tier:Lith")',
    example: 'active:true',
  })
  async getPcEvents(
    @Query() query: Record<string, unknown>,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    return this.getField('events', req, res, query);
  }

  /**
   * Get Active void fissures
   * Route: GET /pc/fissures
   */
  @Get('pc/fissures')
  @ApiOperation({
    summary: 'Get Active void fissures',
    description: 'Active void fissures',
    operationId: 'getPcFissures',
  })
  @ApiResponse({
    status: 200,
    description: 'Active void fissures retrieved successfully',
    type: [Fissure],
  })
  @ApiResponse({
    status: 404,
    description: 'Field not present in worldstate',
  })
  @ApiQuery({
    name: 'filter',
    required: false,
    description:
      'Filter results by field:value pairs, comma-separated (e.g., "active:true,tier:Lith")',
    example: 'active:true',
  })
  async getPcFissures(
    @Query() query: Record<string, unknown>,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    return this.getField('fissures', req, res, query);
  }

  /**
   * Get Flash sales
   * Route: GET /pc/flashSales
   */
  @Get('pc/flashSales')
  @ApiOperation({
    summary: 'Get Flash sales',
    description: 'Flash sales',
    operationId: 'getPcFlashSales',
  })
  @ApiResponse({
    status: 200,
    description: 'Flash sales retrieved successfully',
    type: [FlashSale],
  })
  @ApiResponse({
    status: 404,
    description: 'Field not present in worldstate',
  })
  @ApiQuery({
    name: 'filter',
    required: false,
    description:
      'Filter results by field:value pairs, comma-separated (e.g., "active:true,tier:Lith")',
    example: 'active:true',
  })
  async getPcFlashSales(
    @Query() query: Record<string, unknown>,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    return this.getField('flashSales', req, res, query);
  }

  /**
   * Get Global upgrades/boosters
   * Route: GET /pc/globalUpgrades
   */
  @Get('pc/globalUpgrades')
  @ApiOperation({
    summary: 'Get Global upgrades/boosters',
    description: 'Global upgrades/boosters',
    operationId: 'getPcGlobalUpgrades',
  })
  @ApiResponse({
    status: 200,
    description: 'Global upgrades/boosters retrieved successfully',
    type: [GlobalUpgrade],
  })
  @ApiResponse({
    status: 404,
    description: 'Field not present in worldstate',
  })
  @ApiQuery({
    name: 'filter',
    required: false,
    description:
      'Filter results by field:value pairs, comma-separated (e.g., "active:true,tier:Lith")',
    example: 'active:true',
  })
  async getPcGlobalUpgrades(
    @Query() query: Record<string, unknown>,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    return this.getField('globalUpgrades', req, res, query);
  }

  /**
   * Get Active invasions
   * Route: GET /pc/invasions
   */
  @Get('pc/invasions')
  @ApiOperation({
    summary: 'Get Active invasions',
    description: 'Active invasions',
    operationId: 'getPcInvasions',
  })
  @ApiResponse({
    status: 200,
    description: 'Active invasions retrieved successfully',
    type: [Invasion],
  })
  @ApiResponse({
    status: 404,
    description: 'Field not present in worldstate',
  })
  @ApiQuery({
    name: 'filter',
    required: false,
    description:
      'Filter results by field:value pairs, comma-separated (e.g., "active:true,tier:Lith")',
    example: 'active:true',
  })
  async getPcInvasions(
    @Query() query: Record<string, unknown>,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    return this.getField('invasions', req, res, query);
  }

  /**
   * Get Kuva missions
   * Route: GET /pc/kuva
   */
  @Get('pc/kuva')
  @ApiOperation({
    summary: 'Get Kuva missions',
    description: 'Kuva missions',
    operationId: 'getPcKuva',
  })
  @ApiResponse({
    status: 200,
    description: 'Kuva missions retrieved successfully',
    type: [Kuva],
  })
  @ApiResponse({
    status: 404,
    description: 'Field not present in worldstate',
  })
  @ApiQuery({
    name: 'filter',
    required: false,
    description:
      'Filter results by field:value pairs, comma-separated (e.g., "active:true,tier:Lith")',
    example: 'active:true',
  })
  async getPcKuva(
    @Query() query: Record<string, unknown>,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    return this.getField('kuva', req, res, query);
  }

  /**
   * Get Nightwave season data
   * Route: GET /pc/nightwave
   */
  @Get('pc/nightwave')
  @ApiOperation({
    summary: 'Get Nightwave season data',
    description: 'Nightwave season data',
    operationId: 'getPcNightwave',
  })
  @ApiResponse({
    status: 200,
    description: 'Nightwave season data retrieved successfully',
    type: Nightwave,
  })
  @ApiResponse({
    status: 404,
    description: 'Field not present in worldstate',
  })
  async getPcNightwave(
    @Query() query: Record<string, unknown>,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    return this.getField('nightwave', req, res, query);
  }

  /**
   * Get News items
   * Route: GET /pc/news
   */
  @Get('pc/news')
  @ApiOperation({
    summary: 'Get News items',
    description: 'News items',
    operationId: 'getPcNews',
  })
  @ApiResponse({
    status: 200,
    description: 'News items retrieved successfully',
    type: [News],
  })
  @ApiResponse({
    status: 404,
    description: 'Field not present in worldstate',
  })
  @ApiQuery({
    name: 'filter',
    required: false,
    description:
      'Filter results by field:value pairs, comma-separated (e.g., "active:true,tier:Lith")',
    example: 'active:true',
  })
  async getPcNews(
    @Query() query: Record<string, unknown>,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    return this.getField('news', req, res, query);
  }

  /**
   * Get Persistent enemies (Liches, Sisters)
   * Route: GET /pc/persistentEnemies
   */
  @Get('pc/persistentEnemies')
  @ApiOperation({
    summary: 'Get Persistent enemies (Liches, Sisters)',
    description: 'Persistent enemies (Liches, Sisters)',
    operationId: 'getPcPersistentEnemies',
  })
  @ApiResponse({
    status: 200,
    description: 'Persistent enemies (Liches, Sisters) retrieved successfully',
    type: [PersistentEnemy],
  })
  @ApiResponse({
    status: 404,
    description: 'Field not present in worldstate',
  })
  @ApiQuery({
    name: 'filter',
    required: false,
    description:
      'Filter results by field:value pairs, comma-separated (e.g., "active:true,tier:Lith")',
    example: 'active:true',
  })
  async getPcPersistentEnemies(
    @Query() query: Record<string, unknown>,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    return this.getField('persistentEnemies', req, res, query);
  }

  /**
   * Get Sentient anomaly outpost
   * Route: GET /pc/sentientOutposts
   */
  @Get('pc/sentientOutposts')
  @ApiOperation({
    summary: 'Get Sentient anomaly outpost',
    description: 'Sentient anomaly outpost',
    operationId: 'getPcSentientOutposts',
  })
  @ApiResponse({
    status: 200,
    description: 'Sentient anomaly outpost retrieved successfully',
    type: SentientOutpost,
  })
  @ApiResponse({
    status: 404,
    description: 'Field not present in worldstate',
  })
  async getPcSentientOutposts(
    @Query() query: Record<string, unknown>,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    return this.getField('sentientOutposts', req, res, query);
  }

  /**
   * Get Sanctuary synthesis targets
   * Route: GET /pc/simaris
   */
  @Get('pc/simaris')
  @ApiOperation({
    summary: 'Get Sanctuary synthesis targets',
    description: 'Sanctuary synthesis targets',
    operationId: 'getPcSimaris',
  })
  @ApiResponse({
    status: 200,
    description: 'Sanctuary synthesis targets retrieved successfully',
    type: Simaris,
  })
  @ApiResponse({
    status: 404,
    description: 'Field not present in worldstate',
  })
  async getPcSimaris(
    @Query() query: Record<string, unknown>,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    return this.getField('simaris', req, res, query);
  }

  /**
   * Get Daily sortie missions
   * Route: GET /pc/sortie
   */
  @Get('pc/sortie')
  @ApiOperation({
    summary: 'Get Daily sortie missions',
    description: 'Daily sortie missions',
    operationId: 'getPcSortie',
  })
  @ApiResponse({
    status: 200,
    description: 'Daily sortie missions retrieved successfully',
    type: Sortie,
  })
  @ApiResponse({
    status: 404,
    description: 'Field not present in worldstate',
  })
  async getPcSortie(
    @Query() query: Record<string, unknown>,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    return this.getField('sortie', req, res, query);
  }

  /**
   * Get Steel Path offerings
   * Route: GET /pc/steelPath
   */
  @Get('pc/steelPath')
  @ApiOperation({
    summary: 'Get Steel Path offerings',
    description: 'Steel Path offerings',
    operationId: 'getPcSteelPath',
  })
  @ApiResponse({
    status: 200,
    description: 'Steel Path offerings retrieved successfully',
    type: SteelPathOfferings,
  })
  @ApiResponse({
    status: 404,
    description: 'Field not present in worldstate',
  })
  async getPcSteelPath(
    @Query() query: Record<string, unknown>,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    return this.getField('steelPath', req, res, query);
  }

  /**
   * Get Syndicate missions
   * Route: GET /pc/syndicateMissions
   */
  @Get('pc/syndicateMissions')
  @ApiOperation({
    summary: 'Get Syndicate missions',
    description: 'Syndicate missions',
    operationId: 'getPcSyndicateMissions',
  })
  @ApiResponse({
    status: 200,
    description: 'Syndicate missions retrieved successfully',
    type: [SyndicateMission],
  })
  @ApiResponse({
    status: 404,
    description: 'Field not present in worldstate',
  })
  @ApiQuery({
    name: 'filter',
    required: false,
    description:
      'Filter results by field:value pairs, comma-separated (e.g., "active:true,tier:Lith")',
    example: 'active:true',
  })
  async getPcSyndicateMissions(
    @Query() query: Record<string, unknown>,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    return this.getField('syndicateMissions', req, res, query);
  }

  /**
   * Get Orb Vallis cycle (Warm or Cold)
   * Route: GET /pc/vallisCycle
   */
  @Get('pc/vallisCycle')
  @ApiOperation({
    summary: 'Get Orb Vallis cycle (Warm or Cold)',
    description: 'Orb Vallis cycle (Warm or Cold)',
    operationId: 'getPcVallisCycle',
  })
  @ApiResponse({
    status: 200,
    description: 'Orb Vallis cycle (Warm or Cold) retrieved successfully',
    type: VallisCycle,
  })
  @ApiResponse({
    status: 404,
    description: 'Field not present in worldstate',
  })
  async getPcVallisCycle(
    @Query() query: Record<string, unknown>,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    return this.getField('vallisCycle', req, res, query);
  }

  /**
   * Get Void trader (Baro Ki
   * Route: GET /pc/voidTrader
   */
  @Get('pc/voidTrader')
  @ApiOperation({
    summary: 'Get Void trader (Baro Ki',
    description: 'Void trader (Baro Ki',
    operationId: 'getPcVoidTrader',
  })
  @ApiResponse({
    status: 200,
    description: 'Void trader (Baro Ki retrieved successfully',
    type: VoidTrader,
  })
  @ApiResponse({
    status: 404,
    description: 'Field not present in worldstate',
  })
  async getPcVoidTrader(
    @Query() query: Record<string, unknown>,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    return this.getField('voidTrader', req, res, query);
  }

  /**
   * Get Zariman cycle
   * Route: GET /pc/zarimanCycle
   */
  @Get('pc/zarimanCycle')
  @ApiOperation({
    summary: 'Get Zariman cycle',
    description: 'Zariman cycle',
    operationId: 'getPcZarimanCycle',
  })
  @ApiResponse({
    status: 200,
    description: 'Zariman cycle retrieved successfully',
    type: ZarimanCycle,
  })
  @ApiResponse({
    status: 404,
    description: 'Field not present in worldstate',
  })
  async getPcZarimanCycle(
    @Query() query: Record<string, unknown>,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    return this.getField('zarimanCycle', req, res, query);
  }
}
