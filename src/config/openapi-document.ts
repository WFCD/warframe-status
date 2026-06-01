import { config } from '@nest/config/openapi';
import type { INestApplication } from '@nestjs/common';
import { type OpenAPIObject, SwaggerModule } from '@nestjs/swagger';
import { OpenApiDocumentService } from '@services/openapi-document.service';

export function createOpenApiDocument(app: INestApplication): OpenAPIObject {
  return SwaggerModule.createDocument(app, config);
}

export function setupOpenApi(app: INestApplication): OpenAPIObject {
  const document = createOpenApiDocument(app);
  app.get(OpenApiDocumentService).setDocument(document);
  return document;
}
