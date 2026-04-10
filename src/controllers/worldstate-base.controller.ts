import { Inject, NotFoundException } from '@nestjs/common';
import type { LoggerService } from '@services/logger.service';
import type { WorldStateService } from '@services/worldstate.service';
import type { Request, Response } from 'express';

/**
 * Helper to filter arrays by query parameters
 */
function filterArray(
  query: Record<string, unknown>,
  data: unknown[],
): unknown[] {
  let filtered = data;
  const filterParam = query.filter as string | undefined;

  if (filterParam) {
    filterParam.split(',').forEach((filter) => {
      const [key, value] = filter.split(':');
      filtered = filtered.filter((item: any) => String(item[key]) === value);
    });
  }

  return filtered;
}

/**
 * Base controller with shared field retrieval logic for worldstate routes
 * Generated field routes will extend this class to reuse the getField() implementation
 */
export abstract class WorldstateBaseController {
  @Inject('WORLDSTATE_SERVICE')
  protected worldStateService!: WorldStateService;

  @Inject('LOGGER_SERVICE')
  protected logger!: LoggerService;

  /**
   * Shared implementation for field retrieval
   * Used by all generated field route methods
   *
   * @param field - The worldstate field name (e.g., 'alerts', 'fissures', 'sortie')
   * @param req - Express request object (contains language from middleware)
   * @param res - Express response object (for setting headers)
   * @param query - Query parameters (for filtering arrays)
   * @returns The field data (filtered if array)
   * @throws NotFoundException if worldstate or field is not found
   */
  protected async getField(
    field: string,
    req: Request,
    res: Response,
    query: Record<string, unknown> = {},
  ) {
    const language = (req as any).language || 'en';
    const ws = (await this.worldStateService.getWorldstate(language)) as Record<
      string,
      unknown
    >;

    if (!ws) {
      throw new NotFoundException('WorldState not found');
    }

    const fieldData = ws[field];

    if (fieldData === null || fieldData === undefined) {
      throw new NotFoundException(`worldstate field ${field} not present`);
    }

    res.setHeader('Content-Language', language);

    if (Array.isArray(fieldData)) {
      return filterArray(query, fieldData);
    }

    return fieldData;
  }
}
