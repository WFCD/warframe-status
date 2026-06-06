import { execFileSync } from 'node:child_process';
import * as path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '../..');
const BIOME = path.join(ROOT, 'node_modules/.bin/biome');

export function formatGenerated(...paths: string[]): void {
  if (paths.length === 0) return;

  const absolutePaths = paths.map((entry) => path.resolve(ROOT, entry));

  execFileSync(BIOME, ['check', '--write', '--unsafe', ...absolutePaths], {
    cwd: ROOT,
    stdio: 'inherit',
  });
}
