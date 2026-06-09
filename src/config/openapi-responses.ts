import {
  ApiDetailedNotFoundDto,
  ApiInternalErrorDto,
  ApiMessageNotFoundDto,
  ApiShortNotFoundDto,
  ApiStructuredNotFoundDto,
} from '@dto/errors.dto';
import { applyDecorators } from '@nestjs/common';
import { ApiResponse } from '@nestjs/swagger';

export function ApiShortNotFoundResponse(
  description = 'Requested resource was not found',
) {
  return applyDecorators(
    ApiResponse({ status: 404, description, type: ApiShortNotFoundDto }),
  );
}

export function ApiStructuredNotFoundResponse(
  description = 'Requested worldstate field was not found',
) {
  return applyDecorators(
    ApiResponse({
      status: 404,
      description,
      type: ApiStructuredNotFoundDto,
    }),
  );
}

export function ApiMessageNotFoundResponse(
  description = 'Worldstate or field is not available',
) {
  return applyDecorators(
    ApiResponse({ status: 404, description, type: ApiMessageNotFoundDto }),
  );
}

export function ApiDetailedNotFoundResponse(
  description = 'Requested data key or platform was not found',
) {
  return applyDecorators(
    ApiResponse({ status: 404, description, type: ApiDetailedNotFoundDto }),
  );
}

export function ApiInternalErrorResponse(
  description = 'Cached data could not be loaded',
) {
  return applyDecorators(
    ApiResponse({ status: 500, description, type: ApiInternalErrorDto }),
  );
}
