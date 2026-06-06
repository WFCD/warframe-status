import { ItemNotFoundDto } from '@dto/items.dto';
import {
  Controller,
  Get,
  HttpStatus,
  Inject,
  Param,
  Query,
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
import type { ItemsCacheService } from '@services/items-cache.service';
import type { Request, Response } from 'express';

interface QueryParams {
  remove?: string;
  only?: string;
  filter?: string;
  by?: string;
  language?: string;
}

@ApiTags('items')
@ApiExtraModels(ItemNotFoundDto)
@Controller()
export class ItemsController {
  // Supported languages from @wfcd/items
  private readonly languages = [
    'de',
    'es',
    'fr',
    'it',
    'ko',
    'pl',
    'pt',
    'ru',
    'zh',
    'en',
    'uk',
    'tr',
  ];

  constructor(
    @Inject('ITEMS_CACHE_SERVICE')
    private readonly itemsCache: ItemsCacheService,
  ) {}

  private splitKeys(input?: string): string[] {
    return (input || '').split(',').filter(Boolean);
  }

  private splitFilter(input?: string) {
    return (input || '')
      .split(',')
      .filter(Boolean)
      .map((i) => {
        const [key, value] = i.split(':');
        return { key, value };
      });
  }

  private getItemType(
    path: string,
  ): 'weapons' | 'warframes' | 'items' | 'mods' {
    // Extract the item type from the request path
    const match = path.match(/^\/(weapons|warframes|items|mods)/);
    return (
      (match?.[1] as 'weapons' | 'warframes' | 'items' | 'mods') || 'items'
    );
  }

  /**
   * Extract language from Accept-Language header or language query param
   * Matches Express middleware behavior from src/controllers/index.js:52-59
   */
  private getLanguage(req: Request, queryLanguage?: string): string {
    // Get language from Accept-Language header (first 2 chars)
    let language = (req.headers['accept-language'] || 'en')
      .substring(0, 2)
      .toLowerCase();

    // Allow override via query param
    if (queryLanguage) {
      language = queryLanguage.substring(0, 2).toLowerCase();
    }

    // Validate against supported languages, default to 'en'
    if (!this.languages.includes(language)) {
      language = 'en';
    }

    return language;
  }

  @Get(['weapons', 'warframes', 'items', 'mods'])
  @ApiOperation({
    summary: 'Get all items of a specific type',
    description:
      'Retrieve all weapons, warframes, items, or mods. Supports filtering, field selection, and localization.',
  })
  @ApiQuery({
    name: 'remove',
    required: false,
    description: 'Comma-separated list of fields to exclude from the response',
    example: 'patchlogs,components',
    type: String,
  })
  @ApiQuery({
    name: 'only',
    required: false,
    description: 'Comma-separated list of fields to include in the response',
    example: 'name,uniqueName,type',
    type: String,
  })
  @ApiQuery({
    name: 'filter',
    required: false,
    description:
      'Comma-separated list of key:value filters to apply (e.g., "tradable:true,vaulted:false")',
    example: 'tradable:true',
    type: String,
  })
  @ApiQuery({
    name: 'language',
    required: false,
    description:
      'Language code for localized data. Overrides Accept-Language header. Supported: de, es, fr, it, ko, pl, pt, ru, zh, en, uk, tr',
    example: 'en',
    type: String,
  })
  @ApiHeader({
    name: 'Accept-Language',
    required: false,
    description:
      'Preferred language for the response. First 2 characters are used (e.g., "en-US" becomes "en")',
    example: 'en',
  })
  @ApiResponse({
    status: 200,
    description:
      'Array of items matching the specified type and filters. Items from @wfcd/items library include properties like name, uniqueName, type, category, tradable, and type-specific properties (e.g., damage stats for weapons, health/shield/armor for warframes, polarity/baseDrain for mods).',
    schema: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          uniqueName: {
            type: 'string',
            example: '/Lotus/Powersuits/Excalibur/Excalibur',
          },
          name: { type: 'string', example: 'Excalibur' },
          type: { type: 'string', example: 'Warframe' },
          category: { type: 'string', example: 'Warframes' },
          tradable: { type: 'boolean', example: false },
          masterable: { type: 'boolean', example: true },
        },
      },
    },
  })
  async getAll(
    @Req() req: Request,
    @Res() res: Response,
    @Query() query: QueryParams,
  ) {
    const itemType = this.getItemType(req.path);
    const language = this.getLanguage(req, query.language);
    const { remove, only, filter } = query;

    // Set Vary header if Accept-Language was provided
    if (req.headers['accept-language']) {
      res.setHeader('Vary', 'Accept-Language');
    }

    const result = await this.itemsCache.getItems(itemType, language, {
      remove: this.splitKeys(remove),
      only: this.splitKeys(only),
      filter: this.splitFilter(filter),
    });

    res.setHeader('Content-Language', language);
    return res.status(HttpStatus.OK).json(result);
  }

  @Get(['weapons/:item', 'warframes/:item', 'items/:item', 'mods/:item'])
  @ApiOperation({
    summary: 'Get a specific item by identifier',
    description:
      'Retrieve a single item by its unique identifier (name, uniqueName, etc.). Returns 404 if not found.',
  })
  @ApiParam({
    name: 'item',
    description:
      'Item identifier to search for (can be name, uniqueName, or other field specified by "by" parameter)',
    example: 'Excalibur',
    type: String,
  })
  @ApiQuery({
    name: 'by',
    required: false,
    description:
      'Field to search by (e.g., "name", "uniqueName", "regex"). Defaults to matching any field',
    example: 'name',
    type: String,
  })
  @ApiQuery({
    name: 'remove',
    required: false,
    description: 'Comma-separated list of fields to exclude from the response',
    example: 'patchlogs,components',
    type: String,
  })
  @ApiQuery({
    name: 'only',
    required: false,
    description: 'Comma-separated list of fields to include in the response',
    example: 'name,uniqueName,type',
    type: String,
  })
  @ApiQuery({
    name: 'filter',
    required: false,
    description:
      'Comma-separated list of key:value filters to apply (e.g., "tradable:true")',
    example: 'tradable:true',
    type: String,
  })
  @ApiQuery({
    name: 'language',
    required: false,
    description:
      'Language code for localized data. Overrides Accept-Language header',
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
    description:
      'The requested item with full details from @wfcd/items library',
    schema: {
      type: 'object',
      properties: {
        uniqueName: {
          type: 'string',
          example: '/Lotus/Powersuits/Excalibur/Excalibur',
        },
        name: { type: 'string', example: 'Excalibur' },
        type: { type: 'string', example: 'Warframe' },
        category: { type: 'string', example: 'Warframes' },
        tradable: { type: 'boolean', example: false },
        masterable: { type: 'boolean', example: true },
      },
    },
  })
  @ApiResponse({
    status: 404,
    description: 'Item not found',
    type: ItemNotFoundDto,
  })
  async getOne(
    @Req() req: Request,
    @Res() res: Response,
    @Param('item') item: string,
    @Query() query: QueryParams,
  ) {
    const itemType = this.getItemType(req.path);
    const language = this.getLanguage(req, query.language);
    const { remove, only, filter, by } = query;

    // Set Vary header if Accept-Language was provided
    if (req.headers['accept-language']) {
      res.setHeader('Vary', 'Accept-Language');
    }

    const result = await this.itemsCache.getItems(itemType, language, {
      by,
      only: this.splitKeys(only),
      remove: this.splitKeys(remove),
      filter: this.splitFilter(filter),
      max: 1,
      term: item,
    });

    res.setHeader('Content-Language', language);

    if (result && Object.keys(result).length) {
      return res.status(HttpStatus.OK).json(result);
    }

    return res.status(HttpStatus.NOT_FOUND).json({
      error: 'No Result',
      code: 404,
    });
  }

  @Get([
    'weapons/search/:query',
    'warframes/search/:query',
    'items/search/:query',
    'mods/search/:query',
  ])
  @ApiOperation({
    summary: 'Search for items by query string',
    description:
      'Search for items using one or more comma-separated search terms. Returns all matching results.',
  })
  @ApiParam({
    name: 'query',
    description:
      'Comma-separated search terms to find items. Each term is searched independently and results are combined',
    example: 'Excalibur,Mag',
    type: String,
  })
  @ApiQuery({
    name: 'by',
    required: false,
    description:
      'Field to search by (e.g., "name", "uniqueName", "regex"). Defaults to "name"',
    example: 'name',
    type: String,
  })
  @ApiQuery({
    name: 'remove',
    required: false,
    description: 'Comma-separated list of fields to exclude from the response',
    example: 'patchlogs,components',
    type: String,
  })
  @ApiQuery({
    name: 'only',
    required: false,
    description: 'Comma-separated list of fields to include in the response',
    example: 'name,uniqueName,type',
    type: String,
  })
  @ApiQuery({
    name: 'filter',
    required: false,
    description:
      'Comma-separated list of key:value filters to apply (e.g., "tradable:true")',
    example: 'tradable:true',
    type: String,
  })
  @ApiQuery({
    name: 'language',
    required: false,
    description:
      'Language code for localized data. Overrides Accept-Language header',
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
    description: 'Array of items matching the search query',
    schema: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          uniqueName: {
            type: 'string',
            example: '/Lotus/Powersuits/Excalibur/Excalibur',
          },
          name: { type: 'string', example: 'Excalibur' },
          type: { type: 'string', example: 'Warframe' },
          category: { type: 'string', example: 'Warframes' },
          tradable: { type: 'boolean', example: false },
          masterable: { type: 'boolean', example: true },
        },
      },
    },
  })
  async search(
    @Req() req: Request,
    @Res() res: Response,
    @Param('query') queryParam: string,
    @Query() query: QueryParams,
  ) {
    const itemType = this.getItemType(req.path);
    const language = this.getLanguage(req, query.language);
    const { remove, only, by = 'name', filter } = query;

    // Set Vary header if Accept-Language was provided
    if (req.headers['accept-language']) {
      res.setHeader('Vary', 'Accept-Language');
    }

    const queries = queryParam
      .trim()
      .split(',')
      .map((q) => q.trim().toLowerCase());

    const results = [];
    for (const q of queries) {
      const result = await this.itemsCache.getItems(itemType, language, {
        by,
        remove: this.splitKeys(remove),
        only: this.splitKeys(only),
        term: q,
        max: 0,
        filter: this.splitFilter(filter),
      });
      results.push(result);
    }

    res.setHeader('Content-Language', language);
    return res.status(HttpStatus.OK).json(results.flat());
  }
}
