import { Controller, Get, Inject, Param, Query } from '@nestjs/common';
import {
  ApiExtraModels,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import type { DropsCacheService } from '@services/drops-cache.service';
import { DropDto, DropRewardDto, LocationGroupDto } from '../dto/drops.dto';

@ApiTags('drops')
@ApiExtraModels(DropDto, LocationGroupDto, DropRewardDto)
@Controller('drops')
export class DropsController {
  constructor(
    @Inject('DROPS_CACHE_SERVICE')
    private readonly dropsCacheService: DropsCacheService,
  ) {}

  /**
   * GET /drops
   * @return {Array<Drop>} drop array
   * @summary Drops, responses are cached for 24h
   * @description Get all of the drops
   */
  @Get()
  @ApiOperation({
    summary: 'Get all drop data',
    description:
      'Retrieve the complete drop table for all items in Warframe. Responses are cached for 4 hours.',
  })
  @ApiResponse({
    status: 200,
    description: 'Array of all drops in the game',
    type: [DropDto],
  })
  async getAllDrops() {
    return this.dropsCacheService.get();
  }

  /**
   * GET /drops/search/{query}
   * @param {string} query Drop query
   * @return {Array<Drop>} qualifying drop array
   * @summary Responds with an array of drops matching the query.
   * @description Query-based drop search, responses are cached for an hour
   */
  @Get('search/:query')
  @ApiOperation({
    summary: 'Search for drops by query',
    description:
      'Search for drops matching the query term (searches in item names and locations). Optionally group results by location.',
  })
  @ApiParam({
    name: 'query',
    description:
      'Search term to filter drops (case-insensitive, matches item names and locations)',
    example: 'Axi',
    type: String,
  })
  @ApiQuery({
    name: 'grouped_by',
    required: false,
    description:
      'Group results by location. Currently only "location" is supported.',
    example: 'location',
    type: String,
  })
  @ApiResponse({
    status: 200,
    description:
      'Array of matching drops (or grouped object if grouped_by=location)',
    schema: {
      oneOf: [
        { type: 'array', items: { $ref: '#/components/schemas/DropDto' } },
        {
          type: 'object',
          additionalProperties: {
            $ref: '#/components/schemas/LocationGroupDto',
          },
        },
      ],
    },
  })
  async searchDrops(
    @Param('query') query: string,
    @Query('grouped_by') groupedBy?: string,
  ) {
    return this.dropsCacheService.get({
      term: query,
      groupedBy: groupedBy as 'location' | undefined,
    });
  }
}
