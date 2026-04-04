import { ApiProperty } from '@nestjs/swagger';

/**
 * Represents a single drop with location and item information
 */
export class DropDto {
  @ApiProperty({
    description: 'Location or mission where the item drops',
    example: 'Lua/Apollo (Survival)',
    type: String,
  })
  place: string;

  @ApiProperty({
    description: 'Name of the item that drops',
    example: 'Rotation C',
    type: String,
  })
  item: string;

  @ApiProperty({
    description: 'Rarity tier of the drop',
    enum: ['common', 'uncommon', 'rare', 'legendary'],
    required: false,
    example: 'rare',
  })
  rarity?: 'common' | 'uncommon' | 'rare' | 'legendary';

  @ApiProperty({
    description: 'Drop chance as a decimal percentage (0-100)',
    required: false,
    example: 11.28,
    type: Number,
  })
  chance?: number;

  @ApiProperty({
    description: 'Rotation identifier for endless missions',
    enum: ['A', 'B', 'C', 'D', 'E', 'F', 'G'],
    required: false,
    example: 'C',
  })
  rotation?: 'A' | 'B' | 'C' | 'D' | 'E' | 'F' | 'G';
}

/**
 * Drop information without the place field (used in grouped responses)
 */
export class DropRewardDto {
  @ApiProperty({
    description: 'Name of the item that drops',
    example: 'Axi A14 Relic',
    type: String,
  })
  item: string;

  @ApiProperty({
    description: 'Rarity tier of the drop',
    enum: ['common', 'uncommon', 'rare', 'legendary'],
    required: false,
    example: 'rare',
  })
  rarity?: 'common' | 'uncommon' | 'rare' | 'legendary';

  @ApiProperty({
    description: 'Drop chance as a decimal percentage (0-100)',
    required: false,
    example: 11.28,
    type: Number,
  })
  chance?: number;

  @ApiProperty({
    description: 'Rotation identifier for endless missions',
    enum: ['A', 'B', 'C', 'D', 'E', 'F', 'G'],
    required: false,
    example: 'C',
  })
  rotation?: 'A' | 'B' | 'C' | 'D' | 'E' | 'F' | 'G';
}

/**
 * Location group containing all drops for that location
 */
export class LocationGroupDto {
  @ApiProperty({
    description: 'Array of drops available at this location',
    type: [DropRewardDto],
  })
  rewards: DropRewardDto[];
}

/**
 * Grouped drops organized by location
 * The response is a record/dictionary where keys are location names
 * and values are LocationGroupDto objects containing the rewards array
 */
export type GroupedDropsDto = Record<string, LocationGroupDto>;
