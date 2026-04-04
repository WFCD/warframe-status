#!/usr/bin/env tsx
/**
 * Generate explicit field routes from WorldStateDto
 * 
 * This script parses the WorldStateDto source file to extract field information
 * and generates explicit route methods for each field. This approach provides:
 * - Perfect OpenAPI documentation with specific return types
 * - Type safety from parser -> DTO -> routes -> OpenAPI
 * - Zero maintenance - just update WorldStateDto and regenerate
 * 
 * Usage: npm run generate:routes
 */

import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

interface FieldInfo {
  name: string;
  typeName: string;
  isArray: boolean;
  description: string;
  isOptional: boolean;
}

/**
 * Parse WorldStateDto source file to extract field information
 */
function parseWorldStateDto(): FieldInfo[] {
  const dtoPath = path.join(__dirname, '../src/dto/worldstate.dto.ts');
  const content = fs.readFileSync(dtoPath, 'utf-8');
  
  const fields: FieldInfo[] = [];
  
  // Regex to match field declarations with @ApiProperty
  // Matches patterns like:
  //   @ApiProperty({ description: '...', type: Alert, ... })
  //   fieldName?: Alert;
  const fieldPattern = /@ApiProperty\s*\(\s*\{([^}]+)\}\s*\)\s*(\w+)\s*[?!]?\s*:\s*([^;]+);/g;
  
  let match;
  while ((match = fieldPattern.exec(content)) !== null) {
    const apiPropertyContent = match[1];
    const fieldName = match[2];
    const typeDeclaration = match[3].trim();
    
    // Extract description from @ApiProperty
    const descMatch = /description:\s*['"]([^'"]+)['"]/i.exec(apiPropertyContent);
    const description = descMatch ? descMatch[1] : `${fieldName} data`;
    
    // Extract type information
    let typeName = 'unknown';
    let isArray = false;
    
    if (typeDeclaration.endsWith('[]')) {
      isArray = true;
      typeName = typeDeclaration.slice(0, -2);
    } else {
      typeName = typeDeclaration;
    }
    
    // Check if it's optional
    const isOptional = /required:\s*false/i.test(apiPropertyContent);
    
    fields.push({
      name: fieldName,
      typeName,
      isArray,
      description,
      isOptional,
    });
  }
  
  return fields;
}

/**
 * Generate a route method for a specific field
 */
function generateFieldMethod(field: FieldInfo): string {
  const methodName = `getPc${field.name.charAt(0).toUpperCase()}${field.name.slice(1)}`;
  const operationId = methodName;
  
  // Determine response type for OpenAPI
  let responseType: string;
  let responseDescription: string;
  
  if (field.name === 'timestamp') {
    responseType = 'Number';
    responseDescription = 'Timestamp retrieved successfully';
  } else if (field.isArray) {
    responseType = `[${field.typeName}]`;
    responseDescription = `${field.description} retrieved successfully`;
  } else {
    responseType = field.typeName;
    responseDescription = `${field.description} retrieved successfully`;
  }
  
  // Build the method
  let method = `
  /**
   * Get ${field.description}
   * Route: GET /pc/${field.name}
   */
  @Get('pc/${field.name}')
  @ApiOperation({
    summary: 'Get ${field.description}',
    description: '${field.description}',
    operationId: '${operationId}',
  })
  @ApiResponse({
    status: 200,
    description: '${responseDescription}',
    type: ${responseType},
  })
  @ApiResponse({
    status: 404,
    description: 'Field not present in worldstate',
  })`;
  
  // Add filter query parameter for array fields
  if (field.isArray) {
    method += `
  @ApiQuery({
    name: 'filter',
    required: false,
    description: 'Filter results by field:value pairs, comma-separated (e.g., "active:true,tier:Lith")',
    example: 'active:true',
  })`;
  }
  
  method += `
  async ${methodName}(
    @Query() query: Record<string, unknown>,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    return this.getField('${field.name}', req, res, query);
  }
`;
  
  return method;
}

/**
 * Generate the complete controller file
 */
function generateControllerFile(fields: FieldInfo[]): string {
  const timestamp = new Date().toISOString();
  
  // Collect all unique type names for imports (excluding primitives)
  const typeNames = new Set<string>();
  for (const field of fields) {
    if (field.typeName !== 'number' && field.typeName !== 'Number' && field.typeName !== 'unknown') {
      typeNames.add(field.typeName);
    }
  }
  
  const typeImports = Array.from(typeNames).sort().join(',\n  ');
  
  const methods = fields.map(generateFieldMethod).join('\n');
  
  return `// Auto-generated file - DO NOT EDIT MANUALLY
// Generated from WorldStateDto source file
// Run: npm run generate:routes to regenerate
// Last generated: ${timestamp}

import { Controller, Get, Query, Req, Res } from '@nestjs/common';
import {
  ApiOperation,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import type { Request, Response } from 'express';
import { WorldstateBaseController } from './worldstate-base.controller';

// Import all parser types for OpenAPI documentation
import {
  ${typeImports},
} from 'warframe-worldstate-parser';

/**
 * Generated controller with explicit routes for each worldstate field
 * Extends WorldstateBaseController to reuse shared getField() implementation
 * 
 * Total fields: ${fields.length}
 * Array fields (support filtering): ${fields.filter(f => f.isArray).map(f => f.name).join(', ')}
 * Object fields: ${fields.filter(f => !f.isArray).map(f => f.name).join(', ')}
 */
@Controller()
@ApiTags('worldstate')
export abstract class WorldstateFieldRoutesController extends WorldstateBaseController {
${methods}
}
`;
}

/**
 * Main execution
 */
async function main() {
  console.log('🔍 Parsing WorldStateDto source file...');
  const fields = parseWorldStateDto();
  
  if (fields.length === 0) {
    throw new Error('No fields found in WorldStateDto! Check the regex pattern.');
  }
  
  console.log(`✅ Found ${fields.length} fields:`);
  console.log(`   - Array fields (${fields.filter(f => f.isArray).length}): ${fields.filter(f => f.isArray).map(f => f.name).join(', ')}`);
  console.log(`   - Object fields (${fields.filter(f => !f.isArray).length}): ${fields.filter(f => !f.isArray).map(f => f.name).join(', ')}`);
  
  console.log('\n🔨 Generating controller file...');
  const controllerContent = generateControllerFile(fields);
  
  const outputPath = path.join(__dirname, '../src/controllers/worldstate-field-routes.generated.ts');
  fs.writeFileSync(outputPath, controllerContent, 'utf-8');
  
  console.log(`✅ Generated: ${outputPath}`);
  console.log(`📊 Total routes created: ${fields.length}`);
  console.log('\n✨ Done! You can now use these routes in your worldstate controller.');
}

main().catch((error) => {
  console.error('❌ Error generating field routes:', error);
  process.exit(1);
});
