import { ApiProperty } from '@nestjs/swagger';

/**
 * Short not-found body used by items, profile, pricecheck, and worldstate field routes.
 * Example: { "error": "No Result", "code": 404 }
 */
export class ApiShortNotFoundDto {
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
 * Nest-style not-found body from NotFoundException with a string message.
 * Example: { "statusCode": 404, "message": "worldstate field alerts not present" }
 */
export class ApiMessageNotFoundDto {
  @ApiProperty({
    description: 'HTTP status code',
    example: 404,
    type: Number,
  })
  statusCode!: number;

  @ApiProperty({
    description: 'Error message',
    example: 'WorldState not found',
    type: String,
  })
  message!: string;
}

/**
 * Structured not-found body from worldstate platform/field handlers.
 * Example: { "error": "No such worldstate field", "code": 404 }
 */
export class ApiStructuredNotFoundDto {
  @ApiProperty({
    description: 'Error message',
    example: 'No such worldstate field',
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
 * Nest default not-found body when a platform or data key is rejected.
 * Example: { "error": "Not Found", "statusCode": 404, "message": "Data key 'foo' not found" }
 */
export class ApiDetailedNotFoundDto {
  @ApiProperty({
    description: 'Error type',
    example: 'Not Found',
    type: String,
  })
  error!: string;

  @ApiProperty({
    description: 'HTTP status code',
    example: 404,
    type: Number,
  })
  statusCode!: number;

  @ApiProperty({
    description: 'Detailed error message',
    example: "Data key 'invalid' not found",
    type: String,
  })
  message!: string;
}

/**
 * Nest internal server error when cache hydration fails (drops, rivens, etc.).
 * Example: { "statusCode": 500, "message": "Failed to load drops data" }
 */
export class ApiInternalErrorDto {
  @ApiProperty({
    description: 'HTTP status code',
    example: 500,
    type: Number,
  })
  statusCode!: number;

  @ApiProperty({
    description: 'Error message',
    example: 'Failed to load drops data',
    type: String,
  })
  message!: string;
}
