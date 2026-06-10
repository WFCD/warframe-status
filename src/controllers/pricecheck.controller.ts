import {
  PriceCheckErrorDto,
  PriceCheckInvalidTypeDto,
  PriceCheckNotFoundDto,
  PriceCheckUnavailableDto,
} from '@dto/pricecheck.dto';
import { asPlatform } from '@nest/guards/platform.guard';
import {
  Controller,
  Get,
  HttpStatus,
  Inject,
  NotFoundException,
  Param,
  Query,
  Req,
  Res,
  ServiceUnavailableException,
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
import type { LoggerService } from '@services/logger.service';
import type { PriceCheckService } from '@services/pricecheck.service';
import { parsePriceCheckOptions } from '@nest/utils/parsePriceCheckOptions';
import type { Request, Response } from 'express';

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
      'Query warframe.market for item prices. Supports three response types: "string" (formatted text), "find" (raw data), and "attachment" (Discord embed format). Optional query params filter mod rank and other order modifiers. Requires PRICECHECKS_ENABLED=true.',
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
  @ApiQuery({
    name: 'rank',
    required: false,
    description: 'Filter mod orders to a specific rank (0-10)',
    example: 10,
    type: Number,
  })
  @ApiQuery({
    name: 'ranks',
    required: false,
    description: 'Compare multiple mod ranks in one response (comma-separated, e.g. 0,5,10)',
    example: '0,10',
    type: String,
  })
  @ApiQuery({
    name: 'rankLt',
    required: false,
    description: 'Filter mod orders to ranks less than this value',
    example: 5,
    type: Number,
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
    @Query('rank') rank: string | undefined,
    @Query('ranks') ranks: string | undefined,
    @Query('rankLt') rankLt: string | undefined,
    @Query('charges') charges: string | undefined,
    @Query('chargesLt') chargesLt: string | undefined,
    @Query('amberStars') amberStars: string | undefined,
    @Query('amberStarsLt') amberStarsLt: string | undefined,
    @Query('cyanStars') cyanStars: string | undefined,
    @Query('cyanStarsLt') cyanStarsLt: string | undefined,
    @Query('subtype') subtype: string | undefined,
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
    const options = parsePriceCheckOptions({
      rank,
      ranks,
      rankLt,
      charges,
      chargesLt,
      amberStars,
      amberStarsLt,
      cyanStars,
      cyanStarsLt,
      subtype,
    });

    try {
      let value: unknown;

      switch (type) {
        case 'string':
          value = await this.priceCheckService.priceCheckQueryString(
            query,
            platform,
            options,
          );
          break;
        case 'find':
          value = await this.priceCheckService.priceCheckQuery(
            query,
            platform,
            options,
          );
          break;
        case 'attachment':
          value = await this.priceCheckService.priceCheckQueryAttachment(
            query,
            platform,
            options,
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
      this.logger.error(
        `Error price checking '${query}':`,
        error instanceof Error ? error.stack : String(error),
      );
      res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
        error: `An error ocurred pricechecking \`${query}\``,
        code: 500,
      });
    }
  }
}
