import { Injectable } from '@nestjs/common';
import type { OpenAPIObject } from '@nestjs/swagger';

@Injectable()
export class OpenApiDocumentService {
  private document?: OpenAPIObject;

  setDocument(document: OpenAPIObject): void {
    this.document = document;
  }

  getDocument(): OpenAPIObject {
    if (!this.document) {
      throw new Error('OpenAPI document has not been initialized');
    }
    return this.document;
  }
}
