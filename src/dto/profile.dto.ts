import { ApiProperty } from '@nestjs/swagger';
import type ArsenalData from '@wfcd/arsenal-parser';
// Re-export types from @wfcd/profile-parser and @wfcd/arsenal-parser
import type Profile from '@wfcd/profile-parser/Profile';
import type Stats from '@wfcd/profile-parser/Stats';
import type XpInfo from '@wfcd/profile-parser/XpInfo';

/**
 * Player profile data
 * Re-exported from @wfcd/profile-parser (Profile)
 */
export type ProfileDto = Profile;

/**
 * Player XP and progression information
 * Re-exported from @wfcd/profile-parser (XpInfo)
 */
export type XpInfoDto = XpInfo;

/**
 * Player statistics
 * Re-exported from @wfcd/profile-parser (Stats)
 */
export type StatsDto = Stats;

/**
 * Player arsenal data (loadouts, equipped items, etc.)
 * Re-exported from @wfcd/arsenal-parser (ArsenalData)
 */
export type ArsenalDto = ArsenalData;

/**
 * Error response when profile is not found
 */
export class ProfileNotFoundDto {
  @ApiProperty({
    description: 'Error message',
    example: 'No Result',
    type: String,
  })
  error: string;

  @ApiProperty({
    description: 'HTTP status code',
    example: 404,
    type: Number,
  })
  code: number;
}

/**
 * Error response when arsenal service is unavailable
 */
export class ArsenalUnavailableDto {
  @ApiProperty({
    description: 'HTTP status code',
    example: 503,
    type: Number,
  })
  code: number;

  @ApiProperty({
    description: 'Error message',
    example: 'Service Unavailable',
    type: String,
  })
  error: string;
}
