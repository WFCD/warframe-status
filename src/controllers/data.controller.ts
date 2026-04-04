import { DataErrorDto, DataNotFoundDto } from '@dto/data.dto';
import {
  Controller,
  Get,
  HttpStatus,
  Inject,
  Param,
  Req,
  Res,
} from '@nestjs/common';
import {
  ApiExtraModels,
  ApiHeader,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import type { WarframeDataService } from '@services/warframe-data.service';
import type { Request, Response } from 'express';

/**
 * Controller for static Warframe data endpoints
 * Provides access to various static game data like synthesis targets, arcanes, tutorials, etc.
 */
@ApiTags('synthTargets', 'data')
@ApiExtraModels(DataNotFoundDto, DataErrorDto)
@Controller()
export class DataController {
  constructor(
    @Inject('WarframeDataService')
    private readonly warframeDataService: WarframeDataService,
  ) {}

  /**
   * Get synthesis targets data
   * GET /synthTargets
   */
  @Get('synthTargets')
  @ApiOperation({
    summary: 'Get Sanctuary Synthesis targets',
    description:
      'Retrieve list of Sanctuary Synthesis targets for the Synthesis Scanner system. Supports localization.',
  })
  @ApiQuery({
    name: 'language',
    required: false,
    description:
      'Language code for localized data (2 characters). Supported: en, de, es, fr, it, ko, pl, pt, ru, zh, cs, sr, uk',
    example: 'en',
    type: String,
  })
  @ApiHeader({
    name: 'Accept-Language',
    required: false,
    description:
      'Preferred language for the response. Overridden by language query parameter if provided.',
    example: 'en',
  })
  @ApiResponse({
    status: 200,
    description: 'Array of synthesis target data with locations',
    schema: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          name: { type: 'string', example: 'Ancient Disruptor' },
          imageKey: { type: 'string', example: 'ancient_disruptor' },
          locations: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                last_verified: { type: 'string', example: '2019-02-24' },
                level: { type: 'string', example: '6-16' },
                faction: { type: 'string', example: 'Infested' },
                spawn_rate: { type: 'string', example: '100%' },
                mission: { type: 'string', example: 'Tikal' },
                planet: { type: 'string', example: 'Earth' },
                type: { type: 'string', example: 'Excavation' },
              },
            },
          },
        },
      },
    },
  })
  getSynthTargets(@Req() req: Request, @Res() res: Response): void {
    this.getData('synthTargets', req, res);
  }

  /**
   * Get arcanes data
   * GET /arcanes
   */
  @Get('arcanes')
  @ApiOperation({
    summary: 'Get arcane enhancements data',
    description:
      'Retrieve list of arcane enhancements available in the game. Supports localization.',
  })
  @ApiQuery({
    name: 'language',
    required: false,
    description:
      'Language code for localized data (2 characters). Supported: en, de, es, fr, it, ko, pl, pt, ru, zh, cs, sr, uk',
    example: 'en',
    type: String,
  })
  @ApiHeader({
    name: 'Accept-Language',
    required: false,
    description:
      'Preferred language for the response. Overridden by language query parameter if provided.',
    example: 'en',
  })
  @ApiResponse({
    status: 200,
    description: 'Array of arcane enhancement data',
    schema: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          regex: { type: 'string', example: 'acceleration' },
          name: { type: 'string', example: 'Arcane Acceleration' },
          effect: {
            type: 'string',
            example:
              'On critical hit, 5% / 10% / 15% / 20% chance\nto give 15% / 30% / 45% / 60% Fire Rate to Rifles',
          },
          rarity: {
            type: 'string',
            example: 'Uncommon',
            enum: ['Common', 'Uncommon', 'Rare', 'Legendary'],
          },
          location: { type: 'string', example: 'Changing, check droptable' },
          thumbnail: {
            type: 'string',
            example:
              'https://vignette2.wikia.nocookie.net/warframe/images/9/96/Arcane_Acceleration_160.png',
          },
          info: {
            type: 'string',
            example: 'http://warframe.wikia.com/wiki/Arcane_Acceleration',
          },
        },
      },
    },
  })
  getArcanes(@Req() req: Request, @Res() res: Response): void {
    this.getData('arcanes', req, res);
  }

  /**
   * Get tutorials data
   * GET /tutorials
   */
  @Get('tutorials')
  @ApiOperation({
    summary: 'Get game tutorials data',
    description:
      'Retrieve list of tutorial information available in the game. Supports localization.',
  })
  @ApiQuery({
    name: 'language',
    required: false,
    description:
      'Language code for localized data (2 characters). Supported: en, de, es, fr, it, ko, pl, pt, ru, zh, cs, sr, uk',
    example: 'en',
    type: String,
  })
  @ApiHeader({
    name: 'Accept-Language',
    required: false,
    description:
      'Preferred language for the response. Overridden by language query parameter if provided.',
    example: 'en',
  })
  @ApiResponse({
    status: 200,
    description: 'Array of tutorial data',
    schema: {
      type: 'array',
      items: { type: 'object' },
    },
  })
  getTutorials(@Req() req: Request, @Res() res: Response): void {
    this.getData('tutorials', req, res);
  }

  /**
   * Get conclave data
   * GET /conclave
   */
  @Get('conclave')
  @ApiOperation({
    summary: 'Get Conclave PvP mode data',
    description:
      'Retrieve Conclave PvP mode information. Supports localization.',
  })
  @ApiQuery({
    name: 'language',
    required: false,
    description:
      'Language code for localized data (2 characters). Supported: en, de, es, fr, it, ko, pl, pt, ru, zh, cs, sr, uk',
    example: 'en',
    type: String,
  })
  @ApiHeader({
    name: 'Accept-Language',
    required: false,
    description:
      'Preferred language for the response. Overridden by language query parameter if provided.',
    example: 'en',
  })
  @ApiResponse({
    status: 200,
    description: 'Conclave mode data',
    schema: {
      type: 'object',
    },
  })
  getConclave(@Req() req: Request, @Res() res: Response): void {
    this.getData('conclave', req, res);
  }

  /**
   * Get mission types data
   * GET /missionTypes
   */
  @Get('missionTypes')
  @ApiOperation({
    summary: 'Get mission types data',
    description: 'Retrieve list of mission types. Supports localization.',
  })
  @ApiQuery({
    name: 'language',
    required: false,
    description:
      'Language code for localized data (2 characters). Supported: en, de, es, fr, it, ko, pl, pt, ru, zh, cs, sr, uk',
    example: 'en',
    type: String,
  })
  @ApiHeader({
    name: 'Accept-Language',
    required: false,
    description:
      'Preferred language for the response. Overridden by language query parameter if provided.',
    example: 'en',
  })
  @ApiResponse({
    status: 200,
    description: 'Mission types data',
    schema: {
      type: 'object',
    },
  })
  getMissionTypes(@Req() req: Request, @Res() res: Response): void {
    this.getData('missionTypes', req, res);
  }

  /**
   * Get factions data
   * GET /factions
   */
  @Get('factions')
  @ApiOperation({
    summary: 'Get factions data',
    description: 'Retrieve list of enemy factions. Supports localization.',
  })
  @ApiQuery({
    name: 'language',
    required: false,
    description:
      'Language code for localized data (2 characters). Supported: en, de, es, fr, it, ko, pl, pt, ru, zh, cs, sr, uk',
    example: 'en',
    type: String,
  })
  @ApiHeader({
    name: 'Accept-Language',
    required: false,
    description:
      'Preferred language for the response. Overridden by language query parameter if provided.',
    example: 'en',
  })
  @ApiResponse({
    status: 200,
    description: 'Factions data',
    schema: {
      type: 'object',
    },
  })
  getFactions(@Req() req: Request, @Res() res: Response): void {
    this.getData('factions', req, res);
  }

  /**
   * Get syndicates data
   * GET /syndicates
   */
  @Get('syndicates')
  @ApiOperation({
    summary: 'Get syndicates data',
    description: 'Retrieve list of syndicates. Supports localization.',
  })
  @ApiQuery({
    name: 'language',
    required: false,
    description:
      'Language code for localized data (2 characters). Supported: en, de, es, fr, it, ko, pl, pt, ru, zh, cs, sr, uk',
    example: 'en',
    type: String,
  })
  @ApiHeader({
    name: 'Accept-Language',
    required: false,
    description:
      'Preferred language for the response. Overridden by language query parameter if provided.',
    example: 'en',
  })
  @ApiResponse({
    status: 200,
    description: 'Syndicates data',
    schema: {
      type: 'object',
    },
  })
  getSyndicates(@Req() req: Request, @Res() res: Response): void {
    this.getData('syndicates', req, res);
  }

  /**
   * Get all data for a specific key (generic endpoint)
   * GET /:key
   */
  @Get(':key')
  @ApiOperation({
    summary: 'Get static Warframe data by key (generic)',
    description:
      'Retrieve static Warframe data for any available key. For common endpoints, use the specific routes instead (e.g., /synthTargets, /arcanes). This generic endpoint supports all data keys including: events, operationTypes, persistentEnemy, sortie, upgradeTypes, fissureModifiers, archonShards, and language-specific data (en, de, es, fr, it, ko, pl, pt, ru, zh, cs, sr, uk). Supports localization.',
  })
  @ApiParam({
    name: 'key',
    description:
      'Data key to retrieve. Use specific endpoints for common keys, or this generic endpoint for less common keys like events, operationTypes, persistentEnemy, sortie, upgradeTypes, etc.',
    example: 'events',
    type: String,
  })
  @ApiQuery({
    name: 'language',
    required: false,
    description:
      'Language code for localized data (2 characters). Supported: en, de, es, fr, it, ko, pl, pt, ru, zh, cs, sr, uk',
    example: 'en',
    type: String,
  })
  @ApiHeader({
    name: 'Accept-Language',
    required: false,
    description:
      'Preferred language for the response. Overridden by language query parameter if provided.',
    example: 'en',
  })
  @ApiResponse({
    status: 200,
    description:
      'Static data for the requested key. Structure varies by key type.',
    schema: {
      oneOf: [
        { type: 'array', description: 'Array of data items' },
        { type: 'object', description: 'Object containing data' },
      ],
    },
  })
  @ApiResponse({
    status: 404,
    description: 'Data key not found',
    type: DataNotFoundDto,
  })
  getDataGeneric(
    @Param('key') key: string,
    @Req() req: Request,
    @Res() res: Response,
  ): void {
    this.getData(key, req, res);
  }

  /**
   * Internal method to get data for any key
   */
  private getData(key: string, req: Request, res: Response): void {
    // Normalize the key to match correct case
    const normalizedKey = this.warframeDataService.normalizeKey(key);

    // Check if the key is valid
    const validKeys = this.warframeDataService.getDataKeys();
    if (!validKeys.includes(normalizedKey)) {
      // Key not found, return 404
      res.status(HttpStatus.NOT_FOUND).json({
        error: 'Not Found',
        statusCode: 404,
        message: `Data key '${key}' not found`,
      });
      return;
    }

    // Get language from Accept-Language header or query param
    const language = this.getLanguage(req);

    // Get the data
    const data = this.warframeDataService.getData(normalizedKey, language);

    // Set Content-Language header
    res.setHeader('Content-Language', language);

    // Return the data
    res.status(HttpStatus.OK).json(data);
  }

  /**
   * Search data by query
   * GET /:key/search/:query
   */
  @Get(':key/search/:query')
  @ApiOperation({
    summary: 'Search static Warframe data',
    description:
      'Search for specific entries within a data key using comma-separated query terms. Each term is searched independently and results are combined.',
  })
  @ApiParam({
    name: 'key',
    description:
      'Data key to search within (e.g., synthTargets, arcanes, solNodes)',
    example: 'synthTargets',
    type: String,
  })
  @ApiParam({
    name: 'query',
    description:
      'Comma-separated search terms to find matching entries (case-insensitive)',
    example: 'Synthesis Scanner',
    type: String,
  })
  @ApiQuery({
    name: 'language',
    required: false,
    description: 'Language code for localized data (2 characters)',
    example: 'en',
    type: String,
  })
  @ApiHeader({
    name: 'Accept-Language',
    required: false,
    description: 'Preferred language for the response',
    example: 'en',
  })
  @ApiResponse({
    status: 200,
    description: 'Array of matching data entries',
    schema: {
      type: 'array',
      items: { type: 'object' },
    },
  })
  @ApiResponse({
    status: 500,
    description: 'Search failed or internal server error',
    type: DataErrorDto,
  })
  searchData(
    @Param('key') key: string,
    @Param('query') query: string,
    @Req() req: Request,
    @Res() res: Response,
  ): void {
    try {
      // Normalize the key to match correct case
      const normalizedKey = this.warframeDataService.normalizeKey(key);

      // Get language from Accept-Language header or query param
      const language = this.getLanguage(req);

      // Parse comma-separated queries
      const queries = query.split(',').map((q) => q.trim());

      // Search the data
      const results = this.warframeDataService.search(
        normalizedKey,
        queries,
        language,
      );

      // Set Content-Language header
      res.setHeader('Content-Language', language);

      // Return results
      res.status(HttpStatus.OK).json(results);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
        errors: [message],
        code: 500,
      });
    }
  }

  /**
   * Extract language from request
   */
  private getLanguage(req: Request): string {
    // Get from query param first
    if (req.query.language && typeof req.query.language === 'string') {
      const lang = req.query.language.substring(0, 2).toLowerCase();
      if (this.warframeDataService.getLanguages().includes(lang)) {
        return lang;
      }
    }

    // Get from Accept-Language header
    const acceptLanguage = req.headers['accept-language'];
    if (acceptLanguage) {
      const lang = acceptLanguage.substring(0, 2).toLowerCase();
      if (this.warframeDataService.getLanguages().includes(lang)) {
        return lang;
      }
    }

    // Default to English
    return 'en';
  }
}
