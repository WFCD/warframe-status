import { ApiProperty } from '@nestjs/swagger';

/**
 * Platform identifier for riven data
 */
export type Platform = 'pc' | 'ps4' | 'xb1' | 'swi';

/**
 * Riven statistics for a specific item/compatibility combination
 */
export class RivenStatDto {
  @ApiProperty({
    description: 'Type of item (e.g., "Rifle", "Shotgun", "Melee")',
    example: 'Rifle',
    type: String,
  })
  itemType: string;

  @ApiProperty({
    description: 'Weapon compatibility name',
    example: 'Soma',
    type: String,
  })
  compatibility: string;

  @ApiProperty({
    description: 'Whether this stat is for rerolled rivens',
    example: false,
    type: Boolean,
  })
  rerolled: boolean;

  @ApiProperty({
    description: 'Average platinum price',
    example: 125.5,
    type: Number,
  })
  avg: number;

  @ApiProperty({
    description: 'Standard deviation of prices',
    example: 45.2,
    type: Number,
  })
  stddev: number;

  @ApiProperty({
    description: 'Minimum observed price',
    example: 50,
    type: Number,
  })
  min: number;

  @ApiProperty({
    description: 'Maximum observed price',
    example: 500,
    type: Number,
  })
  max: number;

  @ApiProperty({
    description: 'Population/sample size',
    example: 234,
    type: Number,
  })
  pop: number;

  @ApiProperty({
    description: 'Median price',
    example: 120,
    type: Number,
  })
  median: number;
}

/**
 * Riven compatibility data containing both rerolled and unrolled statistics
 */
export class CompatibilityDto {
  @ApiProperty({
    description: 'Statistics for rerolled rivens',
    type: RivenStatDto,
    required: false,
  })
  rerolled?: RivenStatDto;

  @ApiProperty({
    description: 'Statistics for unrolled/pristine rivens',
    type: RivenStatDto,
    required: false,
  })
  unrolled?: RivenStatDto;
}

/**
 * Riven data grouped by weapon compatibility
 * Keys are weapon names, values contain rerolled/unrolled data
 */
export type ItemTypeDto = Record<string, CompatibilityDto>;

/**
 * Complete riven dataset grouped by item type
 * Keys are item types (e.g., "Rifle", "Shotgun"), values contain compatibility data
 */
export type RivenDataDto = Record<string, ItemTypeDto>;
