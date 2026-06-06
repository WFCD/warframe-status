import { ApiProperty } from '@nestjs/swagger';

/**
 * Error response when Twitter feed is not available
 */
export class TwitterNotFoundDto {
  @ApiProperty({
    description: 'HTTP status code',
    example: 404,
    type: Number,
  })
  statusCode: number;

  @ApiProperty({
    description: 'Error message',
    example: 'No Twitter Data',
    type: String,
  })
  error: string;

  @ApiProperty({
    description: 'HTTP status code (duplicate)',
    example: 404,
    type: Number,
  })
  code: number;
}

/**
 * Twitter feed data
 * The structure depends on the Twitter API and worldstate-emitter implementation
 */
export type TwitterDataDto = unknown;
