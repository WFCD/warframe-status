import type { PriceCheckOptions } from 'warframe-nexus-query';

const parseInteger = (value?: string): number | undefined => {
  if (value == null || value.trim() === '') return undefined;
  const parsed = Number.parseInt(value.trim(), 10);
  if (!Number.isInteger(parsed) || parsed < 0) return undefined;
  return parsed;
};

/**
 * Parse pricecheck query-string params into warframe-nexus-query options.
 */
export const parsePriceCheckOptions = (query: {
  rank?: string;
  ranks?: string;
  rankLt?: string;
  charges?: string;
  chargesLt?: string;
  amberStars?: string;
  amberStarsLt?: string;
  cyanStars?: string;
  cyanStarsLt?: string;
  subtype?: string;
}): PriceCheckOptions => {
  const options: PriceCheckOptions = {};

  if (query.ranks?.trim()) {
    const ranks = query.ranks
      .split(',')
      .map((part) => parseInteger(part))
      .filter((rank): rank is number => rank !== undefined);
    if (ranks.length) options.ranks = [...new Set(ranks)].sort((a, b) => a - b);
  } else {
    const rank = parseInteger(query.rank);
    if (rank !== undefined) options.rank = rank;
  }

  const rankLt = parseInteger(query.rankLt);
  if (rankLt !== undefined) options.rankLt = rankLt;

  const charges = parseInteger(query.charges);
  if (charges !== undefined) options.charges = charges;

  const chargesLt = parseInteger(query.chargesLt);
  if (chargesLt !== undefined) options.chargesLt = chargesLt;

  const amberStars = parseInteger(query.amberStars);
  if (amberStars !== undefined) options.amberStars = amberStars;

  const amberStarsLt = parseInteger(query.amberStarsLt);
  if (amberStarsLt !== undefined) options.amberStarsLt = amberStarsLt;

  const cyanStars = parseInteger(query.cyanStars);
  if (cyanStars !== undefined) options.cyanStars = cyanStars;

  const cyanStarsLt = parseInteger(query.cyanStarsLt);
  if (cyanStarsLt !== undefined) options.cyanStarsLt = cyanStarsLt;

  if (query.subtype?.trim()) options.subtype = query.subtype.trim();

  return options;
};
