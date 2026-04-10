import { ApiProperty } from '@nestjs/swagger';
// Re-export types from warframe-nexus-query for OpenAPI documentation
import type { DiscordEmbed, SummaryV2 } from 'warframe-nexus-query';

/**
 * Price check result from warframe.market
 * Re-exported from warframe-nexus-query (SummaryV2)
 */
export type PriceCheckSummaryDto = SummaryV2;

/**
 * Discord embed format for price check results
 * Re-exported from warframe-nexus-query (DiscordEmbed)
 */
export type PriceCheckAttachmentDto = DiscordEmbed;

/**
 * Error response when price check service is unavailable
 */
export class PriceCheckUnavailableDto {
  @ApiProperty({
    description: 'Error message',
    example: 'Service temporarily unavailable',
    type: String,
  })
  error: string;

  @ApiProperty({
    description: 'HTTP status code',
    example: 503,
    type: Number,
  })
  code: number;
}

/**
 * Error response when item is not found
 */
export class PriceCheckNotFoundDto {
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
 * Error response for invalid request
 */
export class PriceCheckInvalidTypeDto {
  @ApiProperty({
    description: 'Error message describing the invalid type',
    example: 'Invalid type: foo',
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
 * Error response for internal server errors
 */
export class PriceCheckErrorDto {
  @ApiProperty({
    description: 'Error message',
    example: 'An error ocurred pricechecking `Excalibur Prime`',
    type: String,
  })
  error: string;

  @ApiProperty({
    description: 'HTTP status code',
    example: 500,
    type: Number,
  })
  code: number;
}
