import { Controller, Get, HttpStatus, Inject, Res } from '@nestjs/common';
import {
  ApiExtraModels,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import type { WFInfoCacheService } from '@services/wfinfo-cache.service';
import type { Response } from 'express';
import { WFInfoUnavailableDto } from '../dto/wfinfo.dto';

@ApiTags('wfinfo')
@ApiExtraModels(WFInfoUnavailableDto)
@Controller('wfinfo')
export class WFInfoController {
  constructor(
    @Inject('WFINFO_CACHE_SERVICE')
    private readonly wfInfoCacheService: WFInfoCacheService,
  ) {}

  /**
   * GET /wfinfo/filtered_items
   * @return {Object} filtered items data
   * @summary Get WFInfo filtered items data
   */
  @Get('filtered_items')
  @ApiOperation({
    summary: 'Get WFInfo filtered items data',
    description:
      'Retrieve filtered item data used by the WFInfo overlay application. The data structure depends on the external source configured via the WFINFO_FILTERED_ITEMS environment variable. Returns 503 if the service is not configured or unavailable.',
  })
  @ApiResponse({
    status: 200,
    description:
      'Filtered items data including relics (organized by era), equipment (with parts and ducat values), and ignored items (market data)',
    schema: {
      type: 'object',
      properties: {
        errors: { type: 'array', items: { type: 'string' }, example: [] },
        timestamp: { type: 'string', example: '2024-01-15T12:00:00.000Z' },
        relics: {
          type: 'object',
          example: {
            Axi: {
              A1: {
                vaulted: false,
                rare1: 'Aklex Prime Link',
                uncommon1: 'Lex Prime Barrel',
              },
            },
          },
        },
        eqmt: {
          type: 'object',
          example: {
            'Braton Prime': {
              type: 'Primary',
              vaulted: true,
              parts: {
                Blueprint: { count: 1, ducats: 0, vaulted: true },
              },
            },
          },
        },
        ignored_items: {
          type: 'object',
          example: {
            'Peculiar Bloom': { plat: 10, ducats: 0, volume: 50 },
          },
        },
      },
    },
  })
  @ApiResponse({
    status: 503,
    description: 'WFInfo data service is not configured or unavailable',
    type: WFInfoUnavailableDto,
  })
  async getFilteredItems(@Res() res: Response) {
    const items = await this.wfInfoCacheService.getFilteredItems();

    if (!items) {
      return res.status(HttpStatus.SERVICE_UNAVAILABLE).json({
        code: 503,
        error: 'WFInfo Data Services Unavailable',
      });
    }

    return res.status(HttpStatus.OK).json(items);
  }

  /**
   * GET /wfinfo/prices
   * @return {Array} prices data
   * @summary Get WFInfo prices data
   */
  @Get('prices')
  @ApiOperation({
    summary: 'Get WFInfo market prices data',
    description:
      'Retrieve market pricing data used by the WFInfo overlay application. The data structure depends on the external source configured via the WFINFO_PRICES environment variable. Returns 503 if the service is not configured or unavailable.',
  })
  @ApiResponse({
    status: 200,
    description:
      'Market prices data with trading volumes and average prices for items',
    schema: {
      type: 'array',
      items: { $ref: '#/components/schemas/WFInfoPriceItemDto' },
    },
  })
  @ApiResponse({
    status: 503,
    description: 'WFInfo data service is not configured or unavailable',
    type: WFInfoUnavailableDto,
  })
  async getPrices(@Res() res: Response) {
    const prices = await this.wfInfoCacheService.getPrices();

    if (!prices) {
      return res.status(HttpStatus.SERVICE_UNAVAILABLE).json({
        code: 503,
        error: 'WFInfo Data Services Unavailable',
      });
    }

    return res.status(HttpStatus.OK).json(prices);
  }
}
