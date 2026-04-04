import { ApiProperty } from '@nestjs/swagger';

/**
 * Response DTO for the heartbeat health check endpoint
 */
export class HeartbeatResponseDto {
  @ApiProperty({
    description: 'Status message indicating the service is operational',
    example: 'Success',
    type: String,
  })
  message: string;

  @ApiProperty({
    description: 'HTTP status code',
    example: 200,
    type: Number,
  })
  code: number;
}
