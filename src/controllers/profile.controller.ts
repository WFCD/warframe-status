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
import type { ProfileService } from '@services/profile.service';
import type { Request, Response } from 'express';
import { ArsenalUnavailableDto, ProfileNotFoundDto } from '../dto/profile.dto';

/**
 * Controller for player profile endpoints
 */
@ApiTags('profile')
@ApiExtraModels(ProfileNotFoundDto, ArsenalUnavailableDto)
@Controller('profile')
export class ProfileController {
  constructor(
    @Inject('PROFILE_SERVICE')
    private readonly profileService: ProfileService,
  ) {}

  /**
   * Get player profile
   * GET /profile/:playerId
   */
  @Get(':playerId')
  @ApiOperation({
    summary: 'Get player profile data',
    description:
      'Retrieve comprehensive profile information for a player by their account ID or username. Optionally include item details.',
  })
  @ApiParam({
    name: 'playerId',
    description: 'Player account ID or username',
    example: 'Tobiah',
    type: String,
  })
  @ApiQuery({
    name: 'withItem',
    required: false,
    description: 'Include detailed item information in the response',
    example: 'true',
    type: String,
  })
  @ApiQuery({
    name: 'language',
    required: false,
    description: 'Language code for localized data (2 characters)',
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
    description: 'Player profile data',
    schema: { type: 'object' },
  })
  @ApiResponse({
    status: 404,
    description: 'Player not found',
    type: ProfileNotFoundDto,
  })
  async getProfile(
    @Param('playerId') playerId: string,
    @Query('withItem') withItem: string,
    @Req() req: Request,
    @Res() res: Response,
  ): Promise<void> {
    const language = this.getLanguage(req);
    const includeItem = withItem === 'true';

    const profile = await this.profileService.getProfile(
      playerId,
      language,
      includeItem,
    );

    if (!profile) {
      throw new NotFoundException({ error: 'No Result', code: 404 });
    }

    res.status(HttpStatus.OK).json(profile);
  }

  /**
   * Get player XP info
   * GET /profile/:playerId/xpInfo
   */
  @Get(':playerId/xpInfo')
  @ApiOperation({
    summary: 'Get player XP and progression information',
    description:
      'Retrieve experience points, mastery rank, and progression data for a player.',
  })
  @ApiParam({
    name: 'playerId',
    description: 'Player account ID or username',
    example: 'Tobiah',
    type: String,
  })
  @ApiQuery({
    name: 'withItem',
    required: false,
    description: 'Include detailed item information in the response',
    example: 'true',
    type: String,
  })
  @ApiResponse({
    status: 200,
    description: 'Player XP and progression information',
    schema: { type: 'object' },
  })
  @ApiResponse({
    status: 404,
    description: 'Player not found',
    type: ProfileNotFoundDto,
  })
  async getXpInfo(
    @Param('playerId') playerId: string,
    @Query('withItem') withItem: string,
    @Res() res: Response,
  ): Promise<void> {
    const includeItem = withItem === 'true';

    const xpInfo = await this.profileService.getXpInfo(playerId, includeItem);

    if (!xpInfo) {
      throw new NotFoundException({ error: 'No Result', code: 404 });
    }

    res.status(HttpStatus.OK).json(xpInfo);
  }

  /**
   * Get player stats
   * GET /profile/:playerId/stats
   */
  @Get(':playerId/stats')
  @ApiOperation({
    summary: 'Get player statistics',
    description:
      'Retrieve detailed gameplay statistics for a player including mission stats, kill counts, and achievements.',
  })
  @ApiParam({
    name: 'playerId',
    description: 'Player account ID or username',
    example: 'Tobiah',
    type: String,
  })
  @ApiResponse({
    status: 200,
    description: 'Player statistics',
    schema: { type: 'object' },
  })
  @ApiResponse({
    status: 404,
    description: 'Player not found',
    type: ProfileNotFoundDto,
  })
  async getStats(
    @Param('playerId') playerId: string,
    @Res() res: Response,
  ): Promise<void> {
    const stats = await this.profileService.getStats(playerId);

    if (!stats) {
      throw new NotFoundException({ error: 'No Result', code: 404 });
    }

    res.status(HttpStatus.OK).json(stats);
  }

  /**
   * Get player arsenal
   * GET /profile/:username/arsenal
   */
  @Get(':username/arsenal')
  @ApiOperation({
    summary: 'Get player arsenal and loadout data',
    description:
      'Retrieve player loadouts, equipped items, and arsenal configuration. Requires Twitch integration to be configured.',
  })
  @ApiParam({
    name: 'username',
    description: 'Player username (not account ID)',
    example: 'Tobiah',
    type: String,
  })
  @ApiQuery({
    name: 'platform',
    required: false,
    description: 'Platform to query (pc, ps4, xb1, swi). Defaults to pc.',
    example: 'pc',
    type: String,
  })
  @ApiHeader({
    name: 'platform',
    required: false,
    description:
      'Platform to query (pc, ps4, xb1, swi). Overridden by query parameter if both provided.',
    example: 'pc',
  })
  @ApiResponse({
    status: 200,
    description: 'Player arsenal data including loadouts and equipped items',
    schema: { type: 'object' },
  })
  @ApiResponse({
    status: 404,
    description: 'Player not found',
    type: ProfileNotFoundDto,
  })
  @ApiResponse({
    status: 503,
    description: 'Arsenal service unavailable (Twitch token not configured)',
    type: ArsenalUnavailableDto,
  })
  async getArsenal(
    @Param('username') username: string,
    @Req() req: Request,
    @Res() res: Response,
  ): Promise<void> {
    const platform = this.getPlatform(req);

    try {
      const arsenal = await this.profileService.getArsenal(username, platform);

      if (!arsenal) {
        throw new NotFoundException({ error: 'No Result', code: 404 });
      }

      res.status(HttpStatus.OK).json(arsenal);
    } catch (error) {
      if (
        error instanceof Error &&
        error.message === 'Twitch token not available'
      ) {
        throw new ServiceUnavailableException({
          code: 503,
          error: 'Service Unavailable',
        });
      }
      throw error;
    }
  }

  /**
   * Extract language from request
   */
  private getLanguage(req: Request): string {
    // Get from query param first
    if (req.query.language && typeof req.query.language === 'string') {
      return req.query.language.substring(0, 2).toLowerCase();
    }

    // Get from Accept-Language header
    const acceptLanguage = req.headers['accept-language'];
    if (acceptLanguage) {
      return acceptLanguage.substring(0, 2).toLowerCase();
    }

    // Default to English
    return 'en';
  }

  /**
   * Extract platform from request
   */
  private getPlatform(req: Request): string {
    // Get from query param
    if (req.query.platform && typeof req.query.platform === 'string') {
      return req.query.platform.toLowerCase();
    }

    // Get from header
    const platformHeader = req.get('platform');
    if (platformHeader) {
      return platformHeader.toLowerCase();
    }

    // Default to PC
    return 'pc';
  }
}
