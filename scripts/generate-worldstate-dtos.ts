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
import {
  type TsInterfaceInfo,
  type TsPropertyInfo,
  parseTsClassProperties,
  parseTsInterfaces,
} from './lib/parse-parser-ts.ts';
import { fetchParserTypeScriptSource } from './lib/parser-ts-source.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const ROOT = path.join(__dirname, '..');
const OUTPUT_DIR = path.join(ROOT, 'src/dto/worldstate-generated');
const PARSER_PKG = path.join(ROOT, 'node_modules/warframe-worldstate-parser');

/** Non-generated files kept in OUTPUT_DIR across regenerations */
const PRESERVE_OUTPUT_FILES = new Set(['README.md']);

/** Models to skip even if exported */
const SKIP_MODELS = new Set([
  'ExternalMissionClass',
  'Tmp',
  'default',
]);

/** Interfaces that are parser internals, not API response shapes */
const SKIP_INTERFACES = new Set([
  'BaseContentObject',
  'Identifier',
  'Dependency',
  'BountyReward',
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
  'WorldState',
];

interface DecoratorInfo {
  optional: boolean;
  isArray: boolean;
  isString: boolean;
  isNumber: boolean;
  isBoolean: boolean;
  isDate: boolean;
  isObject: boolean;
  validateNested: boolean;
  nestedEach: boolean;
  typeRef: string | null;
  designType: string | null;
}

interface PropertyInfo {
  name: string;
  description: string;
  optional: boolean;
  nullable: boolean;
  typeExpr: string;
  format?: string;
  nestedTypes: string[];
  tsType: string;
}

interface ModelInfo {
  name: string;
  baseClass: string | null;
  properties: PropertyInfo[];
  /** True when generated from a TS interface rather than a parser class */
  isInterface?: boolean;
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
  const rootPath = path.join(PARSER_PKG, 'dist/lib', `${className}.mjs`);
  if (fs.existsSync(rootPath)) {
    const content = fs.readFileSync(rootPath, 'utf-8');
    if (new RegExp(`var ${className} = class`).test(content)) {
      return rootPath;
    }
  }

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

function classDeclarationPattern(className: string): string {
  return `var ${className} = class(?: ${className})?(?: extends [\\w.]+)? \\{`;
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
      `${classDeclarationPattern(className)}([\\s\\S]*?)(?=\\n\\var \\w+ = class|\\n\\};\\n(?:__decorate|//#endregion))`,
    ),
  );
  if (!classMatch) return fields;

  let body = classMatch[1];
  const cutPoints = [
    body.indexOf('\n\tstatic '),
    body.indexOf('\n\tconstructor'),
  ].filter((index) => index >= 0);
  if (cutPoints.length > 0) {
    body = body.slice(0, Math.min(...cutPoints));
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
    `__decorate\\(\\[([\\s\\S]*?)\\],\\s*${className}\\.prototype,\\s*"(\\w+)"`,
    'g',
  );

  let match: RegExpExecArray | null;
  while ((match = pattern.exec(content)) !== null) {
    const block = match[1];
    const propName = match[2];

    let designType: string | null = null;
    if (/__decorateMetadata\("design:type", String\)/.test(block)) {
      designType = 'String';
    } else if (/__decorateMetadata\("design:type", Number\)/.test(block)) {
      designType = 'Number';
    } else if (/__decorateMetadata\("design:type", Boolean\)/.test(block)) {
      designType = 'Boolean';
    } else if (/__decorateMetadata\("design:type", Array\)/.test(block)) {
      designType = 'Array';
    } else if (/__decorateMetadata\("design:type", typeof[^)]*Date/.test(block)) {
      designType = 'Date';
    } else {
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
      isObject: /IsObject\(\)/.test(block),
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
    new RegExp(`var ${className} = class(?: ${className})? extends (\\w+)`),
  );
  return match?.[1] ?? null;
}

function getBasePropertyNames(baseClass: string | null): Set<string> {
  if (!baseClass) return new Set();
  const content = readMjsContent(baseClass);
  if (!content) return new Set();
  return new Set(parseOwnFieldsFromMjs(baseClass, content).keys());
}

function shouldSkipInterface(name: string): boolean {
  if (name.startsWith('Raw')) return true;
  return SKIP_INTERFACES.has(name);
}

function resolvePrimitiveSwaggerType(
  typeName: string,
  isArray: boolean,
): { typeExpr: string; format?: string; tsType: string } | null {
  const map: Record<string, { typeExpr: string; format?: string; tsType: string }> = {
    string: { typeExpr: 'String', tsType: 'string' },
    number: { typeExpr: 'Number', tsType: 'number' },
    boolean: { typeExpr: 'Boolean', tsType: 'boolean' },
    Date: { typeExpr: 'String', format: 'date-time', tsType: 'string' },
  };

  const resolved = map[typeName];
  if (!resolved) return null;

  if (isArray) {
    return {
      typeExpr: `[${resolved.typeExpr}]`,
      format: resolved.format,
      tsType: `${resolved.tsType}[]`,
    };
  }

  return resolved;
}

function resolveReferencedType(
  typeName: string,
  isArray: boolean,
  knownModels: Set<string>,
  interfaceRegistry: Map<string, TsInterfaceInfo>,
  nestedTypes: string[],
): { typeExpr: string; tsType: string } | null {
  if (knownModels.has(typeName)) {
    nestedTypes.push(typeName);
    const dto = toDtoName(typeName);
    if (isArray) {
      return { typeExpr: `[${dto}]`, tsType: `${dto}[]` };
    }
    return { typeExpr: `() => ${dto}`, tsType: dto };
  }

  if (interfaceRegistry.has(typeName) && !shouldSkipInterface(typeName)) {
    nestedTypes.push(typeName);
    const dto = toDtoName(typeName);
    if (isArray) {
      return { typeExpr: `[${dto}]`, tsType: `${dto}[]` };
    }
    return { typeExpr: `() => ${dto}`, tsType: dto };
  }

  return null;
}

function resolveSwaggerType(
  deco: DecoratorInfo,
  tsProp: TsPropertyInfo | undefined,
  knownModels: Set<string>,
  interfaceRegistry: Map<string, TsInterfaceInfo>,
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
    if (deco.validateNested && tsProp?.typeName) {
      const fromTs = resolveReferencedType(
        tsProp.typeName,
        true,
        knownModels,
        interfaceRegistry,
        nestedTypes,
      );
      if (fromTs) return { ...fromTs, nestedTypes, format: undefined };
    }
    if (tsProp?.typeName) {
      const fromTs = resolveReferencedType(
        tsProp.typeName,
        true,
        knownModels,
        interfaceRegistry,
        nestedTypes,
      );
      if (fromTs) return { ...fromTs, nestedTypes, format: undefined };
      const primitive = resolvePrimitiveSwaggerType(tsProp.typeName, true);
      if (primitive) return { ...primitive, nestedTypes };
    }
    return { typeExpr: '[Object]', nestedTypes, tsType: 'unknown[]' };
  }

  if (deco.validateNested && deco.typeRef) {
    nestedTypes.push(deco.typeRef);
    const dto = toDtoName(deco.typeRef);
    return { typeExpr: `() => ${dto}`, nestedTypes, tsType: dto };
  }

  if (deco.validateNested && tsProp?.typeName) {
    const fromTs = resolveReferencedType(
      tsProp.typeName,
      false,
      knownModels,
      interfaceRegistry,
      nestedTypes,
    );
    if (fromTs) return { ...fromTs, nestedTypes, format: undefined };
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

  if (tsProp?.typeName) {
    const fromTs = resolveReferencedType(
      tsProp.typeName,
      tsProp.isArray,
      knownModels,
      interfaceRegistry,
      nestedTypes,
    );
    if (fromTs) return { ...fromTs, nestedTypes, format: undefined };

    const primitive = resolvePrimitiveSwaggerType(
      tsProp.typeName,
      tsProp.isArray,
    );
    if (primitive) return { ...primitive, nestedTypes };
  }

  if (deco.isObject || deco.designType === 'Object') {
    return { typeExpr: 'Object', nestedTypes, tsType: 'Record<string, unknown>' };
  }

  return { typeExpr: 'Object', nestedTypes, tsType: 'unknown' };
}

function buildModelInfo(
  className: string,
  knownModels: Set<string>,
  interfaceRegistry: Map<string, TsInterfaceInfo>,
  tsProperties = new Map<string, TsPropertyInfo>(),
): ModelInfo | null {
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
      isObject: false,
      validateNested: false,
      nestedEach: false,
      typeRef: null,
      designType: null,
    };
    const tsInfo = tsProperties.get(propName);
    const { typeExpr, format, nestedTypes, tsType } = resolveSwaggerType(
      deco,
      tsInfo,
      knownModels,
      interfaceRegistry,
    );
    const optional = deco.optional || tsInfo?.optional || false;
    const nullable = tsInfo?.nullable || false;
    const resolvedTsType =
      nullable && !tsType.includes('null') ? `${tsType} | null` : tsType;

    return {
      name: propName,
      description: ownFields.get(propName) ?? propName,
      optional,
      nullable,
      typeExpr,
      format,
      nestedTypes,
      tsType: resolvedTsType,
    };
  });

  return { name: className, baseClass, properties };
}

function buildInterfaceModelInfo(
  interfaceInfo: TsInterfaceInfo,
  knownModels: Set<string>,
  interfaceRegistry: Map<string, TsInterfaceInfo>,
): ModelInfo {
  const properties: PropertyInfo[] = interfaceInfo.properties.map((prop) => {
    const nestedTypes: string[] = [];
    let typeExpr = 'Object';
    let format: string | undefined;
    let tsType = 'unknown';

    if (prop.typeName) {
      const fromRef = resolveReferencedType(
        prop.typeName,
        prop.isArray,
        knownModels,
        interfaceRegistry,
        nestedTypes,
      );
      if (fromRef) {
        typeExpr = fromRef.typeExpr;
        tsType = fromRef.tsType;
      } else {
        const primitive = resolvePrimitiveSwaggerType(
          prop.typeName,
          prop.isArray,
        );
        if (primitive) {
          typeExpr = primitive.typeExpr;
          format = primitive.format;
          tsType = primitive.tsType;
        }
      }
    }

    const resolvedTsType =
      prop.nullable && !tsType.includes('null') ? `${tsType} | null` : tsType;

    return {
      name: prop.name,
      description: prop.description,
      optional: prop.optional,
      nullable: prop.nullable,
      typeExpr,
      format,
      nestedTypes,
      tsType: resolvedTsType,
    };
  });

  return {
    name: interfaceInfo.name,
    baseClass: null,
    properties,
    isInterface: true,
  };
}


function discoverNeededInterfaces(
  models: ModelInfo[],
  interfaceRegistry: Map<string, TsInterfaceInfo>,
  knownModels: Set<string>,
): Set<string> {
  const needed = new Set<string>();
  const queue: string[] = [];

  for (const model of models) {
    for (const prop of model.properties) {
      for (const nested of prop.nestedTypes) {
        if (
          !knownModels.has(nested) &&
          interfaceRegistry.has(nested) &&
          !shouldSkipInterface(nested)
        ) {
          queue.push(nested);
        }
      }
    }
  }

  while (queue.length > 0) {
    const name = queue.shift()!;
    if (needed.has(name) || shouldSkipInterface(name)) continue;
    needed.add(name);

    const iface = interfaceRegistry.get(name);
    if (!iface) continue;

    for (const prop of iface.properties) {
      if (prop.typeName && interfaceRegistry.has(prop.typeName)) {
        if (!knownModels.has(prop.typeName) && !shouldSkipInterface(prop.typeName)) {
          queue.push(prop.typeName);
        }
      }
    }
  }

  return needed;
}

async function extractModelInfo(
  className: string,
  version: string,
  knownModels: Set<string>,
  interfaceRegistry: Map<string, TsInterfaceInfo>,
): Promise<{ model: ModelInfo | null; tsProperties: Map<string, TsPropertyInfo> }> {
  const tsSource = await fetchParserTypeScriptSource(version, className);
  const tsProperties = tsSource
    ? parseTsClassProperties(tsSource, className)
    : new Map<string, TsPropertyInfo>();
  const model = buildModelInfo(
    className,
    knownModels,
    interfaceRegistry,
    tsProperties,
  );
  return { model, tsProperties };
}

function discoverModels(seeds: string[]): Set<string> {
  const discovered = new Set<string>();
  const queue = [...seeds];

  while (queue.length > 0) {
    const name = queue.shift()!;
    if (discovered.has(name) || SKIP_MODELS.has(name) || name.startsWith('Raw')) {
      continue;
    }

    const info = buildModelInfo(name, discovered, new Set());
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
  const nullablePart = prop.nullable ? ', nullable: true' : '';
  return `  @${decorator}({ description: '${prop.description}', type: ${prop.typeExpr}${formatPart}${nullablePart} })
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
// Generated from warframe-worldstate-parser ${model.isInterface ? 'interface' : 'model'}: ${model.name}
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

  const knownModels = new Set(modelNames);
  const interfaceRegistry = new Map<string, TsInterfaceInfo>();

  for (const name of modelNames) {
    const tsSource = await fetchParserTypeScriptSource(version, name);
    if (!tsSource) continue;
    for (const [ifaceName, iface] of parseTsInterfaces(tsSource)) {
      if (!shouldSkipInterface(ifaceName)) {
        interfaceRegistry.set(ifaceName, iface);
      }
    }
  }

  const worldStateTs = await fetchParserTypeScriptSource(version, 'WorldState');
  if (worldStateTs) {
    for (const [ifaceName, iface] of parseTsInterfaces(worldStateTs)) {
      if (!shouldSkipInterface(ifaceName)) {
        interfaceRegistry.set(ifaceName, iface);
      }
    }
  }


  const models: ModelInfo[] = [];

  for (const name of modelNames) {
    const { model } = await extractModelInfo(
      name,
      version,
      knownModels,
      interfaceRegistry,
    );
    if (model) {
      models.push(model);
    } else {
      console.warn(`⚠️  Skipping ${name} — no metadata found`);
    }
  }

  const neededInterfaces = discoverNeededInterfaces(
    models,
    interfaceRegistry,
    knownModels,
  );

  console.log(`🔍 Discovered ${neededInterfaces.size} TS interfaces for nested DTOs`);

  const interfaceModels: ModelInfo[] = [];
  for (const ifaceName of [...neededInterfaces].sort()) {
    const iface = interfaceRegistry.get(ifaceName);
    if (!iface) continue;
    interfaceModels.push(
      buildInterfaceModelInfo(iface, knownModels, interfaceRegistry),
    );
  }

  const allModels = [...models, ...interfaceModels];

  fs.mkdirSync(OUTPUT_DIR, { recursive: true });

  const generatedFiles = new Map<string, string>();
  for (const model of allModels) {
    const fileName = `${toKebab(model.name)}.dto.ts`;
    generatedFiles.set(fileName, generateDtoFile(model));
  }
  generatedFiles.set(
    'index.ts',
    generateIndex(allModels.map((m) => m.name)),
  );

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
