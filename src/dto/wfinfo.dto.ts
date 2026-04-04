import { ApiProperty } from '@nestjs/swagger';

/**
 * Error response when WFInfo data services are unavailable
 */
export class WFInfoUnavailableDto {
  @ApiProperty({
    description: 'HTTP status code',
    example: 503,
    type: Number,
  })
  code: number;

  @ApiProperty({
    description: 'Error message',
    example: 'WFInfo Data Services Unavailable',
    type: String,
  })
  error: string;
}
