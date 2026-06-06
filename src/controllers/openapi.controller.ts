import { Controller, Get, Header, Inject } from '@nestjs/common';
import type { OpenAPIObject } from '@nestjs/swagger';
import { ApiExcludeController } from '@nestjs/swagger';
import { OpenApiDocumentService } from '@services/openapi-document.service';
import * as yaml from 'js-yaml';

@ApiExcludeController()
@Controller()
export class OpenApiController {
  constructor(
    @Inject(OpenApiDocumentService)
    private readonly openApiDocument: OpenApiDocumentService,
  ) {}

  @Get('openapi.json')
  getJson(): OpenAPIObject {
    return this.openApiDocument.getDocument();
  }

  @Get('openapi.yaml')
  @Header('Content-Type', 'text/yaml')
  getYaml(): string {
    return yaml.dump(this.openApiDocument.getDocument(), {
      skipInvalid: true,
    });
  }
}
