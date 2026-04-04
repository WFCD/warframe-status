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
  error: string;

  @ApiProperty({
    description: 'HTTP status code',
    example: 404,
    type: Number,
  })
  code: number;
}
