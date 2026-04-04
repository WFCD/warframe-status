import {
  type CanActivate,
  type ExecutionContext,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import type { Request } from 'express';
import type { Platform } from 'warframe-nexus-query';

const VALID_PLATFORMS = ['pc', 'ps4', 'psn', 'xb1', 'swi', 'ns'];

export const isPlatform = (input: any): input is Platform => {
  if (typeof input === 'string') {
    return VALID_PLATFORMS.includes(input.toLowerCase());
  }
  return false;
};

export const asPlatform = (input: any): Platform | undefined => {
  if (isPlatform(input)) {
    return input as Platform;
  }
  return undefined;
};

/**
 * Guard to validate that the :platform parameter is a valid Warframe platform.
 * If invalid, throws NotFoundException which allows the request to continue to DataController.
 */
@Injectable()
export class PlatformGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<Request>();
    const platform = request.params.platform;

    if (!isPlatform(platform)) {
      throw new NotFoundException(`Unknown platform: ${platform}`);
    }

    return true;
  }
}
