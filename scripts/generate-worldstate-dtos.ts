#!/usr/bin/env tsx
/**
 * Generate NestJS Swagger DTO classes from warframe-worldstate-parser metadata.
 *
 * Usage: npm run generate:dtos [-- --check]
 */

import * as fs from 'node:fs';
import * as path from 'node:path';
import { fileURLToPath } from 'node:url';
import { formatGenerated } from './lib/format-generated.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const ROOT = path.join(__dirname, '..');
const OUTPUT_DIR = path.join(ROOT, 'src/dto/worldstate-generated');
const PARSER_PKG = path.join(ROOT, 'node_modules/warframe-worldstate-parser');
const CACHE_DIR = path.join(__dirname, '.cache/parser-source');

/** Non-generated files kept in OUTPUT_DIR across regenerations */
const PRESERVE_OUTPUT_FILES = new Set(['README.md']);

/** Models to skip even if exported */
const SKIP_MODELS = new Set([
  'WorldState',
  'ExternalMissionClass',
  'Tmp',
  'WeeklyChallenge',
  'default',
]);

/** Initial seed models (from worldstate-generated.dto.ts + worldstate.dto.ts) */
const SEED_MODELS = [
  'WorldStateObject',
  'Alert',
  'Archimedea',
  'Calendar',
  'CambionCycle',
  'CetusCycle',
  'ChallengeInstance',
  'ConclaveChallenge',
  'ConstructionProgress',
  'DailyDeal',
  'DarkSector',
  'DarkSectorBattle',
  'DuviriCycle',
  'EarthCycle',
  'ExternalMission',
  'Fissure',
  'FlashSale',
  'GlobalUpgrade',
  'Invasion',
  'Kinepage',
  'Kuva',
  'MidrathCycle',
  'Mission',
  'News',
  'Nightwave',
  'NightwaveChallenge',
  'PersistentEnemy',
  'Reward',
  'SentientOutpost',
  'Simaris',
  'Sortie',
  'SortieVariant',
  'SteelPathOfferings',
  'SyndicateJob',
  'SyndicateMission',
  'VallisCycle',
  'VoidTrader',
  'VoidTraderItem',
  'WorldEvent',
  'ZarimanCycle',
];

interface DecoratorInfo {
  optional: boolean;
  isArray: boolean;
  isString: boolean;
  isNumber: boolean;
  isBoolean: boolean;
  isDate: boolean;
  validateNested: boolean;
  nestedEach: boolean;
  typeRef: string | null;
  designType: string | null;
}

interface PropertyInfo {
  name: string;
  description: string;
  optional: boolean;
  typeExpr: string;
  format?: string;
  nestedTypes: string[];
  tsType: string;
}

interface ModelInfo {
  name: string;
  baseClass: string | null;
  properties: PropertyInfo[];
}

type ParserModule = Record<string, unknown>;

function getParserVersion(): string {
  const pkg = JSON.parse(
    fs.readFileSync(path.join(PARSER_PKG, 'package.json'), 'utf-8'),
  ) as { version: string };
  return pkg.version;
}

function toKebab(name: string): string {
  return name
    .replace(/([a-z0-9])([A-Z])/g, '$1-$2')
    .replace(/([A-Z])([A-Z][a-z])/g, '$1-$2')
    .toLowerCase();
}

function toDtoName(className: string): string {
  return `${className}Dto`;
}

function findMjsPath(className: string): string | undefined {
  for (const sub of ['models', 'supporting']) {
    const dir = path.join(PARSER_PKG, 'dist/lib', sub);
    if (!fs.existsSync(dir)) continue;
    for (const file of fs.readdirSync(dir)) {
      if (!file.endsWith('.mjs')) continue;
      const fullPath = path.join(dir, file);
      const content = fs.readFileSync(fullPath, 'utf-8');
      if (new RegExp(`var ${className} = class`).test(content)) {
        return fullPath;
      }
    }
  }
  return undefined;
}

function readMjsContent(className: string): string | null {
  const mjsPath = findMjsPath(className);
  if (!mjsPath) return null;
  return fs.readFileSync(mjsPath, 'utf-8');
}

/** Parse own instance field names and JSDoc for a specific class in a .mjs file */
function parseOwnFieldsFromMjs(className: string, content: string): Map<string, string> {
  const fields = new Map<string, string>();
  const classMatch = content.match(
    new RegExp(
      `var ${className} = class(?: extends [\\w.]+)? \\{([\\s\\S]*?)(?=\\n\\var \\w+ = class|\\n\\};\\n(?:__decorate|//#endregion))`,
    ),
  );
  if (!classMatch) return fields;

  let body = classMatch[1];
  const constructorIdx = body.indexOf('\n\tconstructor');
  if (constructorIdx >= 0) {
    body = body.slice(0, constructorIdx);
  }

  const chunks = body.split(/\n\t/);
  let pendingDoc: string[] = [];

  for (const chunk of chunks) {
    const docMatch = chunk.match(/^\/\*\*([\s\S]*?)\*\/\s*/);
    if (docMatch) {
      pendingDoc = docMatch[1]
        .split('\n')
        .map((l) => l.replace(/^\s*\*\s?/, '').trim())
        .filter((l) => l && !l.startsWith('@'));
    }

    const propMatch = chunk.match(/(?:\/\*\*[\s\S]*?\*\/\s*)?(\w+)\s*;/);
    if (propMatch) {
      const propName = propMatch[1];
      if (propName === 'constructor') continue;
      const desc =
        pendingDoc.join(' ').replace(/\s+/g, ' ').trim() ||
        propName.replace(/([A-Z])/g, ' $1').replace(/^./, (s) => s.toUpperCase());
      fields.set(propName, desc.replace(/'/g, "\\'"));
      pendingDoc = [];
    }
  }

  return fields;
}

/** Parse __decorate blocks for a specific class from compiled .mjs */
function parseDecoratorsFromMjs(content: string, className: string): Map<string, DecoratorInfo> {
  const decorators = new Map<string, DecoratorInfo>();
  const pattern = new RegExp(
    `__decorate\\(\\[([\\s\\S]*?)\\],\\s*${className}\\.prototype,\\s*"(\w+)"`,
    'g',
  );

  let match: RegExpExecArray | null;
  while ((match = pattern.exec(content)) !== null) {
    const block = match[1];
    const propName = match[2];

    let designType: string | null = null;
    if (/design:type",\s*String/.test(block)) designType = 'String';
    else if (/design:type",\s*Number/.test(block)) designType = 'Number';
    else if (/design:type",\s*Boolean/.test(block)) designType = 'Boolean';
    else if (/design:type",\s*Array/.test(block)) designType = 'Array';
    else if (/design:type",\s*typeof[^"]*Date/.test(block)) designType = 'Date';
    else {
      const typeRefMatch = block.match(/Type\(\(\)\s*=>\s*(\w+)\)/);
      if (typeRefMatch) designType = typeRefMatch[1];
    }

    const typeRefMatch = block.match(/Type\(\(\)\s*=>\s*(\w+)\)/);

    decorators.set(propName, {
      optional: /IsOptional\(\)/.test(block),
      isArray: /IsArray\(\)/.test(block),
      isString: /IsString\(/.test(block),
      isNumber: /IsInt\(\)|IsNumber\(/.test(block),
      isBoolean: /IsBoolean\(\)/.test(block),
      isDate: /IsDate\(\)/.test(block),
      validateNested: /ValidateNested\(/.test(block),
      nestedEach: /ValidateNested\(\{\s*each:\s*true\s*\}\)/.test(block),
      typeRef: typeRefMatch?.[1] ?? null,
      designType,
    });
  }

  return decorators;
}

function getBaseClassFromMjs(className: string, content: string): string | null {
  const match = content.match(
    new RegExp(`var ${className} = class extends (\\w+)`),
  );
  return match?.[1] ?? null;
}

function getBasePropertyNames(baseClass: string | null): Set<string> {
  if (!baseClass) return new Set();
  const content = readMjsContent(baseClass);
  if (!content) return new Set();
  return new Set(parseOwnFieldsFromMjs(baseClass, content).keys());
}

function resolveSwaggerType(
  deco: DecoratorInfo,
): { typeExpr: string; format?: string; nestedTypes: string[]; tsType: string } {
  const nestedTypes: string[] = [];

  if (deco.isDate || deco.typeRef === 'Date' || deco.designType === 'Date') {
    return {
      typeExpr: 'String',
      format: 'date-time',
      nestedTypes,
      tsType: 'string',
    };
  }

  if (deco.isArray) {
    if (deco.isString) {
      return { typeExpr: '[String]', nestedTypes, tsType: 'string[]' };
    }
    if (deco.isNumber) {
      return { typeExpr: '[Number]', nestedTypes, tsType: 'number[]' };
    }
    if (deco.isBoolean) {
      return { typeExpr: '[Boolean]', nestedTypes, tsType: 'boolean[]' };
    }
    if (deco.validateNested && deco.typeRef) {
      nestedTypes.push(deco.typeRef);
      const dto = toDtoName(deco.typeRef);
      return { typeExpr: `[${dto}]`, nestedTypes, tsType: `${dto}[]` };
    }
    return { typeExpr: '[Object]', nestedTypes, tsType: 'unknown[]' };
  }

  if (deco.validateNested && deco.typeRef) {
    nestedTypes.push(deco.typeRef);
    const dto = toDtoName(deco.typeRef);
    return { typeExpr: `() => ${dto}`, nestedTypes, tsType: dto };
  }

  if (deco.isString || deco.designType === 'String') {
    return { typeExpr: 'String', nestedTypes, tsType: 'string' };
  }
  if (deco.isBoolean || deco.designType === 'Boolean') {
    return { typeExpr: 'Boolean', nestedTypes, tsType: 'boolean' };
  }
  if (deco.isNumber || deco.designType === 'Number') {
    return { typeExpr: 'Number', nestedTypes, tsType: 'number' };
  }

  return { typeExpr: 'Object', nestedTypes, tsType: 'unknown' };
}

function extractModelInfo(className: string): ModelInfo | null {
  const content = readMjsContent(className);
  if (!content) return null;

  const ownFields = parseOwnFieldsFromMjs(className, content);
  const decorators = parseDecoratorsFromMjs(content, className);
  const baseClass = getBaseClassFromMjs(className, content);
  const basePropertyNames = getBasePropertyNames(baseClass);

  const properties: PropertyInfo[] = [...ownFields.keys()]
    .filter((propName) => !basePropertyNames.has(propName))
    .sort()
    .map((propName) => {
    const deco = decorators.get(propName) ?? {
      optional: false,
      isArray: false,
      isString: false,
      isNumber: false,
      isBoolean: false,
      isDate: false,
      validateNested: false,
      nestedEach: false,
      typeRef: null,
      designType: null,
    };
    const { typeExpr, format, nestedTypes, tsType } = resolveSwaggerType(deco);

    return {
      name: propName,
      description: ownFields.get(propName) ?? propName,
      optional: deco.optional,
      typeExpr,
      format,
      nestedTypes,
      tsType,
    };
  });

  return { name: className, baseClass, properties };
}

async function fetchGithubSource(
  version: string,
  className: string,
): Promise<string | null> {
  for (const sub of ['models', 'supporting']) {
    const cachePath = path.join(CACHE_DIR, sub, `${className}.ts`);
    if (fs.existsSync(cachePath)) {
      return fs.readFileSync(cachePath, 'utf-8');
    }

    const url = `https://raw.githubusercontent.com/WFCD/warframe-worldstate-parser/v${version}/lib/${sub}/${className}.ts`;
    try {
      const res = await fetch(url);
      if (!res.ok) continue;
      const text = await res.text();
      fs.mkdirSync(path.dirname(cachePath), { recursive: true });
      fs.writeFileSync(cachePath, text, 'utf-8');
      return text;
    } catch {
      // network unavailable — skip fallback
    }
  }
  return null;
}

function discoverModels(seeds: string[]): Set<string> {
  const discovered = new Set<string>();
  const queue = [...seeds];

  while (queue.length > 0) {
    const name = queue.shift()!;
    if (discovered.has(name) || SKIP_MODELS.has(name) || name.startsWith('Raw')) {
      continue;
    }

    const info = extractModelInfo(name);
    if (!info) continue;

    discovered.add(name);

    if (info.baseClass && !SKIP_MODELS.has(info.baseClass)) {
      queue.push(info.baseClass);
    }
    for (const prop of info.properties) {
      for (const nested of prop.nestedTypes) {
        if (!discovered.has(nested)) queue.push(nested);
      }
    }
  }

  return discovered;
}

function generatePropertyDecorator(prop: PropertyInfo): string {
  const decorator = prop.optional ? 'ApiPropertyOptional' : 'ApiProperty';
  const formatPart = prop.format ? `, format: '${prop.format}'` : '';
  return `  @${decorator}({ description: '${prop.description}', type: ${prop.typeExpr}${formatPart} })
  ${prop.name}${prop.optional ? '?' : '!'}: ${prop.tsType};`;
}

function generateDtoFile(model: ModelInfo): string {
  const dtoName = toDtoName(model.name);
  const imports = new Set<string>();

  const usesOptional = model.properties.some((prop) => prop.optional);
  const usesRequired = model.properties.some((prop) => !prop.optional);
  const swaggerImports: string[] = [];
  if (usesRequired) swaggerImports.push('ApiProperty');
  if (usesOptional) swaggerImports.push('ApiPropertyOptional');
  if (swaggerImports.length > 0) {
    imports.add(
      `import { ${swaggerImports.join(', ')} } from '@nestjs/swagger';`,
    );
  }

  const nestedImports = new Map<string, string>();
  for (const prop of model.properties) {
    for (const nested of prop.nestedTypes) {
      if (nested !== model.name) {
        nestedImports.set(nested, `./${toKebab(nested)}.dto`);
      }
    }
  }
  if (model.baseClass && model.baseClass !== 'Object') {
    nestedImports.set(model.baseClass, `./${toKebab(model.baseClass)}.dto`);
  }

  for (const [nested, importPath] of [...nestedImports.entries()].sort()) {
    imports.add(`import { ${toDtoName(nested)} } from '${importPath}';`);
  }

  const extendsClause =
    model.baseClass && model.baseClass !== 'Object'
      ? ` extends ${toDtoName(model.baseClass)}`
      : '';

  const props =
    model.properties.length > 0
      ? `\n${model.properties.map(generatePropertyDecorator).join('\n\n')}\n`
      : '\n';

  return `// Auto-generated file - DO NOT EDIT MANUALLY
// Generated from warframe-worldstate-parser model: ${model.name}
// Run: npm run generate:dtos to regenerate

${[...imports].join('\n')}

export class ${dtoName}${extendsClause} {${props}}
`;
}

function generateIndex(modelNames: string[]): string {
  const exports = modelNames
    .sort()
    .map((name) => `export { ${toDtoName(name)} } from './${toKebab(name)}.dto';`)
    .join('\n');

  return `// Auto-generated barrel - DO NOT EDIT MANUALLY
// Run: npm run generate:dtos to regenerate

${exports}
`;
}

async function main(): Promise<void> {
  const checkOnly = process.argv.includes('--check');
  const version = getParserVersion();
  console.log(`📦 Parser version: ${version}`);

  const modelNames = [...discoverModels(SEED_MODELS)].sort();
  console.log(`🔍 Discovered ${modelNames.length} models`);

  const models: ModelInfo[] = [];
  for (const name of modelNames) {
    let info = extractModelInfo(name);
    if (!info || info.properties.length === 0) {
      await fetchGithubSource(version, name);
      info = extractModelInfo(name);
    }
    if (info) {
      models.push(info);
    } else {
      console.warn(`⚠️  Skipping ${name} — no metadata found`);
    }
  }

  fs.mkdirSync(OUTPUT_DIR, { recursive: true });

  const generatedFiles = new Map<string, string>();
  for (const model of models) {
    const fileName = `${toKebab(model.name)}.dto.ts`;
    generatedFiles.set(fileName, generateDtoFile(model));
  }
  generatedFiles.set('index.ts', generateIndex(models.map((m) => m.name)));

  if (checkOnly) {
    let drift = false;
    for (const [fileName, content] of generatedFiles) {
      const filePath = path.join(OUTPUT_DIR, fileName);
      if (!fs.existsSync(filePath) || fs.readFileSync(filePath, 'utf-8') !== content) {
        console.error(`❌ Drift detected: ${fileName}`);
        drift = true;
      }
    }
    const staleStub = path.join(ROOT, 'src/dto/worldstate-generated.dto.ts');
    if (fs.existsSync(staleStub)) {
      console.error('❌ Stale file exists: src/dto/worldstate-generated.dto.ts');
      drift = true;
    }
    if (drift) process.exit(1);
    console.log('✅ Generated DTOs are up to date');
    return;
  }

  for (const [fileName, content] of generatedFiles) {
    fs.writeFileSync(path.join(OUTPUT_DIR, fileName), content, 'utf-8');
  }

  if (fs.existsSync(OUTPUT_DIR)) {
    for (const entry of fs.readdirSync(OUTPUT_DIR)) {
      if (!generatedFiles.has(entry) && !PRESERVE_OUTPUT_FILES.has(entry)) {
        fs.unlinkSync(path.join(OUTPUT_DIR, entry));
      }
    }
  }

  const staleStub = path.join(ROOT, 'src/dto/worldstate-generated.dto.ts');
  if (fs.existsSync(staleStub)) {
    fs.unlinkSync(staleStub);
  }

  console.log(`✅ Generated ${generatedFiles.size} files in ${OUTPUT_DIR}`);
  console.log('🧹 Formatting generated DTOs with Biome...');
  formatGenerated('src/dto/worldstate-generated');
}

main().catch((err) => {
  console.error('❌ Error generating worldstate DTOs:', err);
  process.exit(1);
});
