export interface TsPropertyNullability {
  /** Property uses `?` or includes `| undefined` in its type */
  optional: boolean;
  /** Property type includes `| null` */
  nullable: boolean;
}

export interface TsPropertyInfo extends TsPropertyNullability {
  typeExpression: string;
  /** Primary referenced type name (class or interface), if not inline/primitive */
  typeName: string | null;
  isArray: boolean;
  isInlineObject: boolean;
}

export interface TsInterfaceProperty {
  name: string;
  description: string;
  typeExpression: string;
  typeName: string | null;
  isArray: boolean;
  isInlineObject: boolean;
  optional: boolean;
  nullable: boolean;
}

export interface TsInterfaceInfo {
  name: string;
  properties: TsInterfaceProperty[];
}

const RESERVED_PROPERTY_NAMES = new Set([
  'constructor',
  'get',
  'set',
  'static',
  'async',
]);

const PRIMITIVE_TYPES = new Set(['string', 'number', 'boolean', 'Date']);

export function parseTsTypeExpression(typeExpression: string): {
  typeName: string | null;
  isArray: boolean;
  optional: boolean;
  nullable: boolean;
  isInlineObject: boolean;
} {
  let expr = typeExpression.replace(/\s+/g, ' ').trim();
  const optional = /\|\s*undefined\b/.test(expr);
  const nullable = /\|\s*null\b/.test(expr);

  expr = expr
    .replace(/\|\s*undefined\b/g, '')
    .replace(/\|\s*null\b/g, '')
    .trim();

  let isArray = false;
  if (expr.endsWith('[]')) {
    isArray = true;
    expr = expr.slice(0, -2).trim();
  } else {
    const arrayMatch = /^Array<(.+)>$/.exec(expr);
    if (arrayMatch) {
      isArray = true;
      expr = arrayMatch[1].trim();
    }
  }

  const isInlineObject = expr.startsWith('{');
  if (isInlineObject || PRIMITIVE_TYPES.has(expr)) {
    return {
      typeName: PRIMITIVE_TYPES.has(expr) ? expr : null,
      isArray,
      optional,
      nullable,
      isInlineObject,
    };
  }

  const typeName = expr.split('.').pop()?.replace(/<.*>$/, '') ?? null;
  return { typeName, isArray, optional, nullable, isInlineObject: false };
}

function extractClassBody(source: string, className: string): string | null {
  const startMatch = source.match(
    new RegExp(
      `(?:export\\s+)?class ${className}(?:\\s+extends\\s+[\\w.]+)?\\s*\\{`,
    ),
  );
  if (!startMatch || startMatch.index === undefined) return null;

  const openBrace = startMatch.index + startMatch[0].length - 1;
  let depth = 0;

  for (let i = openBrace; i < source.length; i++) {
    const char = source[i];
    if (char === '{') depth++;
    else if (char === '}') {
      depth--;
      if (depth === 0) {
        return source.slice(openBrace + 1, i);
      }
    }
  }

  return null;
}

function extractInterfaceBody(
  source: string,
  startIndex: number,
): string | null {
  const openBrace = source.indexOf('{', startIndex);
  if (openBrace === -1) return null;

  let depth = 0;
  for (let i = openBrace; i < source.length; i++) {
    const char = source[i];
    if (char === '{') depth++;
    else if (char === '}') {
      depth--;
      if (depth === 0) {
        return source.slice(openBrace + 1, i);
      }
    }
  }

  return null;
}

function removeBlock(source: string, startPattern: RegExp): string {
  const match = startPattern.exec(source);
  if (!match || match.index === undefined) return source;

  const braceStart = source.indexOf('{', match.index + match[0].length);
  if (braceStart === -1) {
    return source.slice(0, match.index) + source.slice(match.index + match[0].length);
  }

  let depth = 0;
  for (let i = braceStart; i < source.length; i++) {
    if (source[i] === '{') depth++;
    else if (source[i] === '}') {
      depth--;
      if (depth === 0) {
        return source.slice(0, match.index) + source.slice(i + 1);
      }
    }
  }

  return source;
}

function removeMethodsAndConstructor(classBody: string): string {
  let result = classBody;
  const patterns = [
    /\bconstructor\s*\(/,
    /\bstatic\s+(?:async\s+)?[\w]+\s*\(/,
    /\b(?:async\s+)?get\s+[\w.]+\s*\(/,
    /\b(?:async\s+)?set\s+[\w.]+\s*\(/,
    /\b(?:async\s+)?[\w]+\s*\([^)]*\)\s*(?::\s*[^{;]+)?\s*\{/,
  ];

  for (const pattern of patterns) {
    let next = removeBlock(result, pattern);
    while (next !== result) {
      result = next;
      next = removeBlock(result, pattern);
    }
  }

  return result;
}

function parsePropertyBlock(
  block: string,
  name: string,
  marker: string,
  typeExpression: string,
): TsPropertyInfo {
  const normalizedType = typeExpression
    .replace(/\s+/g, ' ')
    .replace(/\s*\n\s*/g, ' ')
    .trim();
  const fromType = parseTsTypeExpression(normalizedType);

  return {
    optional: marker === '?' || fromType.optional,
    nullable: fromType.nullable,
    typeExpression: normalizedType,
    typeName: fromType.typeName,
    isArray: fromType.isArray,
    isInlineObject: fromType.isInlineObject,
  };
}

/**
 * Parse class property types and nullability from parser TypeScript source.
 */
export function parseTsClassProperties(
  source: string,
  className: string,
): Map<string, TsPropertyInfo> {
  const classBody = extractClassBody(source, className);
  if (!classBody) return new Map();

  const declarations = removeMethodsAndConstructor(classBody);
  const properties = new Map<string, TsPropertyInfo>();

  const propertyPattern =
    /(?:\/\*\*[\s\S]*?\*\/\s*)*(?:@\w+(?:\([^)]*\))?\s*)*(?:(?:public|private|protected|readonly)\s+)*([\w]+)([?!]?):\s*([\s\S]*?);/g;

  let match: RegExpExecArray | null;
  while ((match = propertyPattern.exec(declarations)) !== null) {
    const name = match[1];
    if (RESERVED_PROPERTY_NAMES.has(name)) continue;

    properties.set(
      name,
      parsePropertyBlock(match[0], name, match[2], match[3]),
    );
  }

  return properties;
}

/**
 * Parse class property optionality/nullability from parser TypeScript source.
 */
export function parseTsClassPropertyNullability(
  source: string,
  className: string,
): Map<string, TsPropertyNullability> {
  const properties = parseTsClassProperties(source, className);
  const nullability = new Map<string, TsPropertyNullability>();

  for (const [name, info] of properties) {
    nullability.set(name, {
      optional: info.optional,
      nullable: info.nullable,
    });
  }

  return nullability;
}

function parseJsDocDescription(block: string): string {
  const docMatch = block.match(/\/\*\*([\s\S]*?)\*\//);
  if (!docMatch) return '';

  return docMatch[1]
    .split('\n')
    .map((line) => line.replace(/^\s*\*\s?/, '').trim())
    .filter((line) => line && !line.startsWith('@'))
    .join(' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Parse exported interfaces from parser TypeScript source.
 */
export function parseTsInterfaces(source: string): Map<string, TsInterfaceInfo> {
  const interfaces = new Map<string, TsInterfaceInfo>();
  const startPattern =
    /(?:\/\*\*[\s\S]*?\*\/\s*)?export interface (\w+)(?: extends [\w<>, ]+)?\s*\{/g;

  let match: RegExpExecArray | null;
  while ((match = startPattern.exec(source)) !== null) {
    const name = match[1];
    const body = extractInterfaceBody(source, match.index + match[0].length - 1);
    if (!body) continue;

    const properties: TsInterfaceProperty[] = [];
    const propertyPattern =
      /(?:\/\*\*([\s\S]*?)\*\/\s*)?([\w]+)([?!]?):\s*([\s\S]*?);/g;

    let propMatch: RegExpExecArray | null;
    while ((propMatch = propertyPattern.exec(body)) !== null) {
      const propName = propMatch[2];
      const normalizedType = propMatch[4]
        .replace(/\s+/g, ' ')
        .replace(/\s*\n\s*/g, ' ')
        .trim();
      const fromType = parseTsTypeExpression(normalizedType);
      const description =
        parseJsDocDescription(propMatch[0]) ||
        propName.replace(/([A-Z])/g, ' $1').replace(/^./, (s) => s.toUpperCase());

      properties.push({
        name: propName,
        description: description.replace(/'/g, "\\'"),
        typeExpression: normalizedType,
        typeName: fromType.typeName,
        isArray: fromType.isArray,
        isInlineObject: fromType.isInlineObject,
        optional: propMatch[3] === '?' || fromType.optional,
        nullable: fromType.nullable,
      });
    }

    interfaces.set(name, { name, properties });
  }

  return interfaces;
}
