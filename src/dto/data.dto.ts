import { ApiProperty } from '@nestjs/swagger';

/**
 * Error response when data key is not found
 */
export class DataNotFoundDto {
  @ApiProperty({
    description: 'Error message',
    example: 'Not Found',
    type: String,
  })
  error: string;

  @ApiProperty({
    description: 'HTTP status code',
    example: 404,
    type: Number,
  })
  statusCode: number;

  @ApiProperty({
    description: 'Detailed error message',
    example: "Data key 'invalid' not found",
    type: String,
  })
  message: string;
}

/**
 * Error response for internal server errors
 */
export class DataErrorDto {
  @ApiProperty({
    description: 'Array of error messages',
    type: [String],
    example: ['Search failed for key: invalid'],
  })
  errors: string[];

  @ApiProperty({
    description: 'HTTP status code',
    example: 500,
    type: Number,
  })
  code: number;
}
