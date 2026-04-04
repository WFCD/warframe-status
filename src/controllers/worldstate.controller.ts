import {
  Controller,
  Get,
  HttpStatus,
  Inject,
  NotFoundException,
  Param,
  Query,
  Redirect,
  Req,
  Res,
} from '@nestjs/common';
import {
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import type { LoggerService } from '@services/logger.service';
import type { WarframeDataService } from '@services/warframe-data.service';
import type { WorldStateService } from '@services/worldstate.service';
import type { Request, Response } from 'express';
import { Platform } from 'warframe-nexus-query';
import { WorldstateFieldRoutesController } from './worldstate-field-routes.generated';

const PLATFORMS = ['pc', 'ps4', 'psn', 'xb1', 'swi', 'ns'];

const LANGUAGES = [
  'de',
  'es',
  'fr',
  'it',
  'ko',
  'pl',
  'pt',
  'ru',
  'zh',
  'cs',
  'sr',
  'uk',
  'en',
];

/**
 * Helper to filter arrays by query parameters
 */
function filterArray(
  query: Record<string, unknown>,
  data: unknown[],
): unknown[] {
  let filtered = data;
  const filterParam = query.filter as string | undefined;

  if (filterParam) {
    filterParam.split(',').forEach((filter) => {
      const [key, value] = filter.split(':');
      filtered = filtered.filter((item: any) => String(item[key]) === value);
    });
  }

  return filtered;
}

@Controller()
@ApiTags('worldstate')
export class WorldstateController extends WorldstateFieldRoutesController {
  constructor(
    @Inject('WarframeDataService')
    private readonly warframeDataService: WarframeDataService,
  ) {
    super();
  }

  /**
   * GET /:platform - Get worldstate for a specific platform
   * @return {Object} worldstate data
   * @summary Get worldstate for platform
   */
  @Get(':platform')
  @ApiOperation({ summary: 'Get worldstate data for a specific platform' })
  @ApiParam({
    name: 'platform',
    description: 'Platform identifier (pc, ps4, psn, xb1, swi, ns)',
    enum: PLATFORMS,
  })
  @ApiResponse({
    status: 200,
    description: 'Complete worldstate data for the platform',
    schema: {
      type: 'object',
      properties: {
        timestamp: { type: 'string', format: 'date-time' },
        news: { type: 'array', items: { type: 'object' } },
        events: { type: 'array', items: { type: 'object' } },
        alerts: { type: 'array', items: { type: 'object' } },
        sortie: { type: 'object' },
        syndicateMissions: { type: 'array', items: { type: 'object' } },
        fissures: { type: 'array', items: { type: 'object' } },
        invasions: { type: 'array', items: { type: 'object' } },
        voidTrader: { type: 'object' },
        dailyDeals: { type: 'array', items: { type: 'object' } },
        nightwave: { type: 'object' },
      },
    },
  })
  @ApiResponse({ status: 301, description: 'Redirected to PC platform' })
  @ApiResponse({ status: 404, description: 'WorldState not found' })
  async getWorldstate(
    @Param('platform') platform: string,
    @Req() req: Request,
    @Res() res: Response,
  ) {
    this.logger.info(`Requested worldstate for ${platform}`);

    // Check if this is a valid platform for worldstate
    if (!PLATFORMS.includes(platform.toLowerCase())) {
      this.logger.warn('Unsupported platform');
      // Not a valid platform - return 404
      throw new NotFoundException({
        error: 'Not Found',
        statusCode: 404,
        message: `Platform '${platform}' not found`,
      });
    }

    // Redirect non-PC platforms to PC
    if (
      platform !== 'pc' &&
      ['ps4', 'psn', 'swi', 'xb1', 'ns'].includes(platform)
    ) {
      this.logger.debug(`Redirecting to pc (original: ${platform}`);
      const redirPath = req.originalUrl.replace(
        /\/(ps4|psn|swi|xb1|ns)\/?/gi,
        '/pc/',
      );
      return res.redirect(HttpStatus.MOVED_PERMANENTLY, redirPath);
    }

    this.logger.info(`Resolving pc (original: ${platform})`);
    const language = (req as any).language || 'en';
    const ws = await this.worldStateService.getWorldstate(language);
    this.logger.debug(`Resolved worldState... ${JSON.stringify(ws, null, 2)}`);
    res.setHeader('Content-Language', language);
    if (typeof ws === 'undefined') {
      throw new NotFoundException('WorldState Not Found');
    }
    return res.json(ws);
  }

  /**
   * GET /:platform/:field
   * Get a specific field from the worldstate
   * @param {string} field worldstate field name
   * @return {Object|Array} worldstate field data
   * @summary Get specific worldstate field
   */
  @Get(':platform/:field')
  @ApiOperation({ summary: 'Get a specific field from worldstate' })
  @ApiParam({
    name: 'platform',
    description: 'Platform identifier (pc, ps4, psn, xb1, swi, ns)',
    enum: PLATFORMS,
  })
  @ApiParam({
    name: 'field',
    description: 'Worldstate field name (e.g., alerts, invasions, fissures)',
    examples: {
      alerts: { value: 'alerts', description: 'Active alerts' },
      invasions: { value: 'invasions', description: 'Current invasions' },
      fissures: { value: 'fissures', description: 'Active void fissures' },
      sortie: { value: 'sortie', description: 'Daily sortie missions' },
    },
  })
  @ApiQuery({
    name: 'filter',
    required: false,
    description: 'Filter results by field values (format: field:value)',
    example: 'missionType:Assassination',
  })
  @ApiResponse({
    status: 200,
    description: 'Worldstate field data',
    schema: {
      oneOf: [{ type: 'array', items: { type: 'object' } }, { type: 'object' }],
    },
  })
  @ApiResponse({ status: 301, description: 'Redirected to PC platform' })
  @ApiResponse({ status: 404, description: 'Worldstate field not found' })
  getWorldstateField(
    @Param('platform') platform: string,
    @Param('field') field: string,
    @Query() query: Record<string, unknown>,
    @Req() req: Request,
    @Res() res: Response,
  ) {
    // Check if this is a valid platform for worldstate
    if (!PLATFORMS.includes(platform.toLowerCase())) {
      // Not a platform - might be a language/field combo or invalid
      if (LANGUAGES.includes(platform.substring(0, 2).toLowerCase())) {
        // This is /:language/:field for worldstate
        return this.getWorldstateFieldWithLanguage(platform, field, query, res);
      }
      // Invalid route
      throw new NotFoundException();
    }

    // Check if this might be a language/field route with a platform that's also a language
    if (LANGUAGES.includes(platform.substring(0, 2).toLowerCase())) {
      // This is actually /:language/:field, handle it differently
      return this.getWorldstateFieldWithLanguage(platform, field, query, res);
    }

    // Check if this might be a language/field route instead (e.g., /en/alerts)
    if (LANGUAGES.includes(platform.substring(0, 2).toLowerCase())) {
      // This is actually /:language/:field, handle it differently
      return this.getWorldstateFieldWithLanguage(platform, field, query, res);
    }

    // Redirect non-PC platforms to PC
    if (
      platform !== 'pc' &&
      ['ps4', 'psn', 'swi', 'xb1', 'ns'].includes(platform)
    ) {
      const redirPath = req.originalUrl.replace(
        /\/(ps4|psn|swi|xb1|ns)\/?/gi,
        '/pc/',
      );
      return res.redirect(HttpStatus.MOVED_PERMANENTLY, redirPath);
    }

    let language = (req as any).language || 'en';
    const ws = this.worldStateService.getWorldstate(language) as Record<
      string,
      unknown
    >;

    if (!ws) {
      throw new NotFoundException({
        error: 'No such worldstate field',
        code: 404,
      });
    }

    // Check if field is actually a language code
    if (
      field.length <= 4 &&
      LANGUAGES.includes(field.substring(0, 2).toLowerCase())
    ) {
      language = field.substring(0, 2).toLowerCase();
      const ows = this.worldStateService.getWorldstate(language);
      res.setHeader('Content-Language', language);

      if (Array.isArray(ows)) {
        return res.json(filterArray(query, ows));
      }
      return res.json(ows);
    }

    // Check if field exists in worldstate
    if (!Object.keys(ws).includes(field) && field.length > 4) {
      throw new NotFoundException({
        error: 'No such worldstate field',
        code: 404,
      });
    }

    const fieldData = ws[field];

    if (fieldData !== undefined) {
      res.setHeader('Content-Language', language);

      if (Array.isArray(fieldData)) {
        return res.json(filterArray(query, fieldData));
      }

      return res.json(fieldData);
    }

    throw new NotFoundException({
      error: 'No such worldstate field',
      code: 404,
    });
  }

  /**
   * Helper method to handle /:language/:field routes
   * @param {string} language language code
   * @param {string} field worldstate field name
   * @return {Object|Array} worldstate field data in specified language
   * @private
   */
  private getWorldstateFieldWithLanguage(
    languageParam: string,
    field: string,
    query: Record<string, unknown>,
    res: Response,
  ) {
    const language = LANGUAGES.includes(
      languageParam.substring(0, 2).toLowerCase(),
    )
      ? languageParam.substring(0, 2).toLowerCase()
      : 'en';

    const ws = this.worldStateService.getWorldstate(language) as Record<
      string,
      unknown
    >;

    if (!ws || !Object.keys(ws).includes(field)) {
      throw new NotFoundException({
        error: 'No such worldstate field',
        code: 404,
      });
    }

    const fieldData = ws[field];

    if (fieldData !== undefined) {
      res.setHeader('Content-Language', language);

      if (Array.isArray(fieldData)) {
        return res.json(filterArray(query, fieldData));
      }

      return res.json(fieldData);
    }

    throw new NotFoundException({
      error: 'No such worldstate field',
      code: 404,
    });
  }
}
