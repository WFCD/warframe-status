import { Controller, Get, Inject } from '@nestjs/common';
import {
  ApiExtraModels,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import type { WorldStateService } from '@services/worldstate.service';
import { RssFeedItemDto } from '../dto/rss.dto';

@ApiTags('social')
@ApiExtraModels(RssFeedItemDto)
@Controller('rss')
export class RssController {
  constructor(
    @Inject('WORLDSTATE_SERVICE')
    private readonly worldStateService: WorldStateService,
  ) {}

  /**
   * GET /rss
   * @return {Object} RSS feed data
   * @summary Get RSS feed data
   */
  @Get()
  @ApiOperation({
    summary: 'Get Warframe RSS feed',
    description:
      'Retrieve the latest Warframe news and updates from official RSS feeds. Returns an array of feed items grouped by feed URL.',
  })
  @ApiResponse({
    status: 200,
    description:
      'Array of RSS feeds, each containing a URL and array of feed items',
    type: [RssFeedItemDto],
  })
  getRss() {
    return this.worldStateService.getRss();
  }
}
