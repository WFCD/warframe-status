import { ApiProperty } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import {
  IsBoolean,
  IsIn,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Max,
  Min,
} from 'class-validator';

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
  @IsString()
  @IsNotEmpty()
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
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(10)
  rank?: number;

  @ApiProperty({
    description:
      'The set bonus rank for mods that are part of a set. The default is the max set bonus.',
    example: 'setBonus=6',
    default: 6,
    type: Number,
    minimum: 0,
    maximum: 6,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(6)
  setBonus?: number;

  @ApiProperty({
    description:
      'Output format for the generated image. Supports PNG, JPEG, AVIF, and WEBP. Defaults to PNG',
    default: 'png',
    example: 'format=jpeg',
    type: String,
  })
  @IsOptional()
  @Transform(({ value }) =>
    typeof value === 'string' ? value.toLowerCase() : value,
  )
  @IsIn(['png', 'jpeg', 'webp', 'avif'])
  format?: 'png' | 'jpeg' | 'webp' | 'avif';

  @ApiProperty({
    description: 'Create a collapsed or "equipped" version of the mod',
    default: false,
    example: 'minimized=true',
    type: Boolean,
  })
  @IsOptional()
  @Transform(({ value }) =>
    value === undefined || value === null || value === ''
      ? undefined
      : value === true || value === 'true',
  )
  @IsBoolean()
  minimized?: boolean;

  @ApiProperty({
    description: 'Language to use when generating said mod',
    example: 'language=en',
    type: String,
  })
  @IsOptional()
  @IsString()
  language?: string;
}
