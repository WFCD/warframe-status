import { WorldStateDto } from '@dto/worldstate.dto';
import type { RequestWithLanguage } from '@nest/types/express';
import {
  Controller,
  Get,
  HttpStatus,
  NotFoundException,
  Param,
  Query,
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
import { VALID_PLATFORMS } from '@nest/guards/platform.guard';
import type { Response } from 'express';
import { WorldstateFieldRoutesController } from './worldstate-field-routes.generated';

const PLATFORMS = [...VALID_PLATFORMS];
const PLATFORM_PATHS = PLATFORMS.map((platform) => `${platform}`);
const PLATFORM_FIELD_PATHS = PLATFORMS.map((platform) => `${platform}/:field`);

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

const LANGUAGE_FIELD_PATHS = LANGUAGES.map((language) => `${language}/:field`);

function firstPathSegment(path: string): string {
  return path.split('/').filter(Boolean)[0] || '';
}

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
      filtered = filtered.filter((item) => {
        const record = item as Record<string, unknown>;
        return String(record[key]) === value;
      });
    });
  }

  return filtered;
}

@Controller()
@ApiTags('worldstate')
export class WorldstateController extends WorldstateFieldRoutesController {
  /**
   * GET /:platform - Get worldstate for a specific platform
   * @return {Object} worldstate data
   * @summary Get worldstate for platform
   */
  @Get(PLATFORM_PATHS)
  @ApiOperation({ summary: 'Get worldstate data for a specific platform' })
  @ApiParam({
    name: 'platform',
    description: 'Platform identifier (pc, ps4, psn, xb1, swi, ns)',
    enum: PLATFORMS,
  })
  @ApiResponse({
    status: 200,
    description: 'Complete worldstate data for the platform',
    type: WorldStateDto,
  })
  @ApiResponse({ status: 301, description: 'Redirected to PC platform' })
  @ApiResponse({ status: 404, description: 'WorldState not found' })
  async getWorldstate(
    @Req() req: RequestWithLanguage,
    @Res() res: Response,
  ) {
    const platform = firstPathSegment(req.path);
    this.logger.info(`Requested worldstate for ${platform}`);

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

    this.logger.debug(`Resolving pc (original: ${platform})`);
    const language = req.language || 'en';
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
   * @param platform
   * @param {string} field worldstate field name
   * @param query
   * @param req
   * @param res
   * @return {Object|Array} worldstate field data
   * @summary Get specific worldstate field
   */
  @Get(PLATFORM_FIELD_PATHS)
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
    @Param('field') field: string,
    @Query() query: Record<string, unknown>,
    @Req() req: RequestWithLanguage,
    @Res() res: Response,
  ) {
    const platform = firstPathSegment(req.path);

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

    let language = req.language || 'en';
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
   * GET /:language/:field
   * Get a worldstate field in a specific language
   */
  @Get(LANGUAGE_FIELD_PATHS)
  @ApiOperation({ summary: 'Get a worldstate field in a specific language' })
  @ApiParam({
    name: 'language',
    description: 'Language code for localized worldstate data',
    enum: LANGUAGES,
  })
  @ApiParam({
    name: 'field',
    description: 'Worldstate field name (e.g., alerts, invasions, fissures)',
  })
  @ApiResponse({ status: 200, description: 'Worldstate field data' })
  @ApiResponse({ status: 404, description: 'Worldstate field not found' })
  getWorldstateFieldByLanguage(
    @Param('field') field: string,
    @Query() query: Record<string, unknown>,
    @Req() req: RequestWithLanguage,
    @Res() res: Response,
  ) {
    const language = firstPathSegment(req.path);
    return this.getWorldstateFieldWithLanguage(language, field, query, res);
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
