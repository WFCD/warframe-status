import * as fs from 'node:fs';
import * as path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const CACHE_DIR = path.join(__dirname, '../.cache/parser-source');

const memoryCache = new Map<string, string>();

const SEARCH_LOCATIONS = [
  { cacheSubdir: 'models', urlPath: 'lib/models' },
  { cacheSubdir: 'supporting', urlPath: 'lib/supporting' },
  { cacheSubdir: 'root', urlPath: 'lib' },
] as const;

export async function fetchParserTypeScriptSource(
  version: string,
  className: string,
): Promise<string | null> {
  const cacheKey = `${version}:${className}`;
  if (memoryCache.has(cacheKey)) {
    return memoryCache.get(cacheKey)!;
  }

  for (const { cacheSubdir, urlPath } of SEARCH_LOCATIONS) {
    const cachePath = path.join(CACHE_DIR, cacheSubdir, `${className}.ts`);
    if (fs.existsSync(cachePath)) {
      const cached = fs.readFileSync(cachePath, 'utf-8');
      memoryCache.set(cacheKey, cached);
      return cached;
    }

    const url = `https://raw.githubusercontent.com/WFCD/warframe-worldstate-parser/v${version}/${urlPath}/${className}.ts`;
    try {
      const res = await fetch(url);
      if (!res.ok) continue;
      const text = await res.text();
      fs.mkdirSync(path.dirname(cachePath), { recursive: true });
      fs.writeFileSync(cachePath, text, 'utf-8');
      memoryCache.set(cacheKey, text);
      return text;
    } catch {
      // network unavailable — skip fallback
    }
  }

  return null;
}
