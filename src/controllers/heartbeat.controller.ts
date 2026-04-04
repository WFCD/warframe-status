import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { HeartbeatResponseDto } from '../dto/heartbeat.dto';

@ApiTags('system')
@Controller('heartbeat')
export class HeartbeatController {
  @Get()
  @ApiOperation({
    summary: 'Health check endpoint',
    description:
      'Returns a simple success message to verify the API is operational',
  })
  @ApiResponse({
    status: 200,
    description: 'Service is healthy and operational',
    type: HeartbeatResponseDto,
  })
  getHeartbeat(): HeartbeatResponseDto {
    return { message: 'Success', code: 200 };
  }
}
