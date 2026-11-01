import { ApiProperty } from '@nestjs/swagger';

/**
 * Error response when an item is not found
 */
export class ItemNotFoundDto {
  @ApiProperty({
    description: 'Error message',
    example: 'No Result',
    type: String,
  })
  error!: string;

  @ApiProperty({
    description: 'HTTP status code',
    example: 404,
    type: Number,
  })
  code!: number;
}


/**
 * Mod generator config
 */
export class GenerateModConfigDto {
  @ApiProperty({
    description: 'The uniqueName of the mod to be generated',
    required: true,
    example:
      'uniqueName=/Lotus/Upgrades/Mods/Warframe/AvatarDamageReductionInAir',
    type: String,
  })
  uniqueName!: string;

  @ApiProperty({
    description:
      'Rank this mod will be generated at. The default is the max rank.',
    example: 'rank=5',
    type: Number,
    default: 10,
    minimum: 0,
    maximum: 10,
  })
  rank!: number;

  @ApiProperty({
    description: 'The set bonus rank for mods that are part of a set. The default is the max set bonus.',
    example: 'setBonus=6',
    default: 6,
    type: Number,
    minimum: 1,
    maximum: 6,
  })
  setBonus!: number;

  @ApiProperty({ description: 'Output format for the generated image. Supports PNG, JPEG, AVIF, and WEBP. Defaults to PNG', default: 'png', example: 'format=jpeg', type: String })
  format!: 'png' | 'jpeg' | 'webp' | 'avif';

  @ApiProperty({ description: 'Create a collapsed or "equipped" version of the mod', default: false, example: 'minimized=true', type: String })
  minimized!: boolean;

  @ApiProperty({ description: 'Language to use when generating said mod', example: 'language=en', type: String })
  language!: string;
}
