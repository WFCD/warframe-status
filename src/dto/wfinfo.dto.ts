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
  code!: number;

  @ApiProperty({
    description: 'Error message',
    example: 'WFInfo Data Services Unavailable',
    type: String,
  })
  error!: string;
}

/**
 * Market price entry from WFInfo prices feed
 */
export class WFInfoPriceItemDto {
  @ApiProperty({
    description: 'Item name',
    example: 'Ash Prime Neuroptics Blueprint',
    type: String,
  })
  name!: string;

  @ApiProperty({
    description: 'Trading volume from the previous day',
    example: 12,
    type: Number,
  })
  yesterday_vol!: number;

  @ApiProperty({
    description: 'Trading volume for the current day',
    example: 8,
    type: Number,
  })
  today_vol!: number;

  @ApiProperty({
    description: 'Custom average price in platinum',
    example: 45,
    type: Number,
  })
  custom_avg!: number;
}
