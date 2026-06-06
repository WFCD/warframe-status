import type { Request } from 'express';

export type RequestWithLanguage = Request & {
  language?: string;
};
