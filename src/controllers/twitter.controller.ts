import {
  Controller,
  Get,
  HttpStatus,
  Inject,
  NotFoundException,
  Optional,
} from '@nestjs/common';
import {
  ApiExtraModels,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import type { WorldStateService } from '@services/worldstate.service';
import { TwitterNotFoundDto } from '../dto/twitter.dto';

@ApiTags('social')
@ApiExtraModels(TwitterNotFoundDto)
@Controller('twitter')
export class TwitterController {
  private readonly twitterActive: boolean;

  constructor(
    @Optional()
    @Inject('WORLDSTATE_SERVICE')
    private readonly worldStateService?: WorldStateService,
  ) {
    // Check if Twitter is active from environment
    this.twitterActive = process.env.TWITTER_ACTIVE === 'true';
  }

  /**
   * GET /twitter
   * @return {Array} twitter feed data
   * @summary Get Twitter feed data
   */
  @Get()
  @ApiOperation({
    summary: 'Get Warframe Twitter feed',
    description:
      'Retrieve recent tweets from official Warframe Twitter accounts. Requires TWITTER_ACTIVE=true environment variable. Returns 404 if Twitter integration is not enabled.',
  })
  @ApiResponse({
    status: 200,
    description:
      'Twitter feed data. Structure depends on Twitter API response format.',
    schema: {
      type: 'object',
    },
  })
  @ApiResponse({
    status: 404,
    description: 'Twitter integration is not enabled or data unavailable',
    type: TwitterNotFoundDto,
  })
  async getTwitter() {
    if (!this.twitterActive || !this.worldStateService) {
      throw new NotFoundException({
        statusCode: 404,
        error: 'No Twitter Data',
        code: 404,
      });
    }

    const twitterData = await this.worldStateService.getTwitter();
    return twitterData;
  }
}
