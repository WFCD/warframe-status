import { asPlatform, isPlatform } from '@nest/guards/platform.guard.js';
import {
  Controller,
  Get,
  HttpStatus,
  Inject,
  NotFoundException,
  Param,
  Req,
  Res,
  ServiceUnavailableException,
} from '@nestjs/common';
import {
  ApiExtraModels,
  ApiHeader,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import type { LoggerService } from '@services/logger.service';
import type { PriceCheckService } from '@services/pricecheck.service';
import type { Request, Response } from 'express';
import { Platform } from 'warframe-nexus-query';
import {
  PriceCheckErrorDto,
  PriceCheckInvalidTypeDto,
  PriceCheckNotFoundDto,
  PriceCheckUnavailableDto,
} from '../dto/pricecheck.dto';

/**
 * Controller for price checking endpoints
 */
@ApiTags('pricecheck')
@ApiExtraModels(
  PriceCheckUnavailableDto,
  PriceCheckNotFoundDto,
  PriceCheckInvalidTypeDto,
  PriceCheckErrorDto,
)
@Controller('pricecheck')
export class PriceCheckController {
  constructor(
    @Inject('PRICECHECK_SERVICE')
    private readonly priceCheckService: PriceCheckService,
    @Inject('LOGGER_SERVICE')
    private readonly logger: LoggerService,
  ) {}

  /**
   * Price check by type and query
   * GET /pricecheck/:type/:query
   */
  @Get(':type/:query')
  @ApiOperation({
    summary: 'Price check items on warframe.market',
    description:
      'Query warframe.market for item prices. Supports three response types: "string" (formatted text), "find" (raw data), and "attachment" (Discord embed format). Requires PRICECHECKS_ENABLED=true.',
  })
  @ApiParam({
    name: 'type',
    description:
      'Response format type: "string" for formatted text, "find" for raw SummaryV2 data, "attachment" for Discord embed format',
    enum: ['string', 'find', 'attachment'],
    example: 'find',
  })
  @ApiParam({
    name: 'query',
    description: 'Item name or search query',
    example: 'Excalibur Prime',
    type: String,
  })
  @ApiHeader({
    name: 'platform',
    required: false,
    description:
      'Platform to query (pc, ps4, xb1, swi, ns). Defaults to pc if not provided.',
    example: 'pc',
  })
  @ApiResponse({
    status: 200,
    description:
      'Price check results. Format depends on type parameter: string returns formatted text, find returns SummaryV2[], attachment returns DiscordEmbed[]',
    schema: {
      oneOf: [
        { type: 'string', description: 'Formatted price text (type=string)' },
        {
          type: 'array',
          description: 'Array of price summaries (type=find)',
          items: { type: 'object' },
        },
        {
          type: 'array',
          description: 'Array of Discord embeds (type=attachment)',
          items: { type: 'object' },
        },
      ],
    },
  })
  @ApiResponse({
    status: 404,
    description: 'Item not found or invalid type parameter',
    schema: {
      oneOf: [
        { $ref: '#/components/schemas/PriceCheckNotFoundDto' },
        { $ref: '#/components/schemas/PriceCheckInvalidTypeDto' },
      ],
    },
  })
  @ApiResponse({
    status: 500,
    description: 'Internal server error during price check',
    type: PriceCheckErrorDto,
  })
  @ApiResponse({
    status: 503,
    description: 'Price check service is disabled or unavailable',
    type: PriceCheckUnavailableDto,
  })
  async priceCheck(
    @Param('type') type: string,
    @Param('query') query: string,
    @Req() req: Request,
    @Res() res: Response,
  ): Promise<void> {
    // Check if price checks are enabled
    if (!this.priceCheckService.isEnabled()) {
      throw new ServiceUnavailableException({
        error: 'Service temporarily unavailable',
        code: 503,
      });
    }

    // Get platform from header
    const platform = asPlatform(req.get('platform'));

    try {
      let value: unknown;

      switch (type) {
        case 'string':
          value = await this.priceCheckService.priceCheckQueryString(
            query,
            platform,
          );
          break;
        case 'find':
          value = await this.priceCheckService.priceCheckQuery(query, platform);
          break;
        case 'attachment':
          value = await this.priceCheckService.priceCheckQueryAttachment(
            query,
            platform,
          );
          break;
        default:
          throw new NotFoundException({
            error: `Invalid type: ${type}`,
            code: 404,
          });
      }

      if (value) {
        res.status(HttpStatus.OK).json(value);
      } else {
        res.status(HttpStatus.NOT_FOUND).json({
          error: 'No Result',
          code: 404,
        });
      }
    } catch (error) {
      this.logger.error(`Error price checking '${query}':`, error);
      res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
        error: `An error ocurred pricechecking \`${query}\``,
        code: 500,
      });
    }
  }
}
