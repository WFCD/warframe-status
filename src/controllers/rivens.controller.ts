import { Controller, Get, Inject, Param, Query } from '@nestjs/common';
import {
  ApiExtraModels,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import type {
  Platform,
  RivensCacheService,
} from '@services/rivens-cache.service';
import {
  CompatibilityDto,
  RivenDataDto,
  RivenStatDto,
} from '../dto/rivens.dto';

@ApiTags('rivens')
@ApiExtraModels(RivenStatDto, CompatibilityDto)
@Controller(':platform/rivens')
export class RivensController {
  constructor(
    @Inject('RIVENS_CACHE_SERVICE')
    private readonly rivensCacheService: RivensCacheService,
  ) {}

  /**
   * GET /:platform/rivens
   * @return {RivenData} riven data for platform
   * @summary Get all riven data for a platform
   */
  @Get()
  @ApiOperation({
    summary: 'Get all riven disposition and pricing data',
    description:
      'Retrieve complete riven mod statistics for the specified platform, including average prices, population data, and disposition values.',
  })
  @ApiParam({
    name: 'platform',
    description: 'Platform identifier (pc, ps4, xb1, swi, ns)',
    enum: ['pc', 'ps4', 'xb1', 'swi', 'ns'],
    example: 'pc',
  })
  @ApiResponse({
    status: 200,
    description:
      'Riven data grouped by item type and weapon compatibility. Each weapon has separate stats for rerolled and unrolled rivens.',
    schema: {
      type: 'object',
      additionalProperties: {
        type: 'object',
        additionalProperties: { $ref: '#/components/schemas/CompatibilityDto' },
      },
    },
  })
  async getAllRivens(@Param('platform') platform: string) {
    // Normalize platform: 'ns' -> 'swi'
    const normalizedPlatform = (
      platform === 'ns' ? 'swi' : platform
    ) as Platform;
    return this.rivensCacheService.get(normalizedPlatform);
  }

  /**
   * GET /:platform/rivens/search/{query}
   * @param {string} query Riven compatibility search query
   * @return {RivenData} matching riven data
   * @summary Search riven data by compatibility name
   */
  @Get('search/:query')
  @ApiOperation({
    summary: 'Search riven data by weapon compatibility name',
    description:
      'Find riven statistics for weapons matching the search query. Returns filtered data containing only matching compatibilities.',
  })
  @ApiParam({
    name: 'platform',
    description: 'Platform identifier (pc, ps4, xb1, swi, ns)',
    enum: ['pc', 'ps4', 'xb1', 'swi', 'ns'],
    example: 'pc',
  })
  @ApiParam({
    name: 'query',
    description:
      'Weapon compatibility name to search for (case-insensitive partial match)',
    example: 'Soma',
    type: String,
  })
  @ApiResponse({
    status: 200,
    description:
      'Riven data filtered to only include weapons matching the search query',
    schema: {
      type: 'object',
      additionalProperties: {
        type: 'object',
        additionalProperties: { $ref: '#/components/schemas/CompatibilityDto' },
      },
    },
  })
  async searchRivens(
    @Param('platform') platform: string,
    @Param('query') query: string,
  ) {
    // Normalize platform: 'ns' -> 'swi'
    const normalizedPlatform = (
      platform === 'ns' ? 'swi' : platform
    ) as Platform;
    return this.rivensCacheService.get(normalizedPlatform, query);
  }
}
