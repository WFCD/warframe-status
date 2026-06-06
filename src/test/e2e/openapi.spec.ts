import { createOpenApiDocument } from '@nest/config/openapi-document';
import type { INestApplication } from '@nestjs/common';
import type { OpenAPIObject } from '@nestjs/swagger';
import * as chai from 'chai';
import chaiHttp, { request } from 'chai-http';
import packageJson from '../../../package.json' with { type: 'json' };
import { getApp } from '../hooks/setup.hook';

chai.should();
chai.use(chaiHttp);

function schemaRef(schema: OpenAPIObject, name: string) {
  return schema.components?.schemas?.[name];
}

describe('OpenAPI', () => {
  let nestApp: INestApplication;
  let document: OpenAPIObject;

  before(() => {
    nestApp = getApp();
    document = createOpenApiDocument(nestApp);
  });

  describe('HTTP endpoints', () => {
    it('GET /openapi.json should return the spec', async () => {
      const res = await request
        .execute(nestApp.getHttpServer())
        .get('/openapi.json');

      res.should.have.status(200);
      res.should.have.header('content-type', /json/);
      res.body.should.be.an('object');
      res.body.should.have.property('openapi').that.matches(/^3\./);
      res.body.should.have.property('paths');
      res.body.should.have.property('components');
    });

    it('should use package.json version and info x-logo extension', () => {
      document.info.version.should.equal(packageJson.version);
      document.info.should.have.property('x-logo').that.deep.equals({
        url: 'https://docs.warframestat.com/wfcd_logo_color.png',
        altText: 'Warframe Community Developers',
        backgroundColor: 'transparent',
        href: 'https://github.com/WFCD/',
      });
      document.should.not.have.property('x-logo');
    });

    it('GET /openapi.yaml should return the spec', async () => {
      const res = await request
        .execute(nestApp.getHttpServer())
        .get('/openapi.yaml');

      res.should.have.status(200);
      res.should.have.header('content-type', /yaml/);
      res.text.should.be.a('string');
      res.text.should.include('openapi:');
      res.text.should.include('WorldStateDto:');
    });
  });

  describe('worldstate schemas', () => {
    it('should include WorldStateDto and AlertDto', () => {
      schemaRef(document, 'WorldStateDto').should.be.an('object');
      schemaRef(document, 'AlertDto').should.be.an('object');
    });

    it('should reference AlertDto from WorldStateDto.alerts', () => {
      const worldState = schemaRef(document, 'WorldStateDto') as {
        properties?: { alerts?: { items?: { $ref?: string } } };
      };

      worldState.properties?.alerts?.items?.$ref.should.equal(
        '#/components/schemas/AlertDto',
      );
    });

    it('should document generated worldstate field routes', () => {
      document.paths.should.have.property('/pc/alerts');
      document.paths.should.have.property('/pc/fissures');
      document.paths.should.have.property('/pc/timestamp');
    });

    it('should document platform worldstate route with WorldStateDto response', () => {
      document.paths.should.have.property('/{platform}');

      const platformGet = document.paths['/{platform}']?.get;
      platformGet?.should.be.an('object');

      const responseSchema =
        platformGet?.responses?.['200']?.content?.['application/json']?.schema;

      responseSchema?.$ref.should.equal('#/components/schemas/WorldStateDto');
    });
  });

  describe('schema coverage', () => {
    it('should include core generated worldstate DTOs', () => {
      const expected = [
        'AlertDto',
        'CetusCycleDto',
        'FissureDto',
        'InvasionDto',
        'NightwaveDto',
        'SortieDto',
        'VoidTraderDto',
        'WorldStateDto',
      ];

      for (const name of expected) {
        schemaRef(document, name).should.be.an(
          'object',
          `missing schema ${name}`,
        );
      }
    });

    it('should include at least 40 component schemas', () => {
      const schemaNames = Object.keys(document.components?.schemas ?? {});
      schemaNames.length.should.be.at.least(40);
    });

    it('should include WFInfoPriceItemDto on /wfinfo/prices', () => {
      schemaRef(document, 'WFInfoPriceItemDto').should.be.an('object');

      const pricesSchema =
        document.paths['/wfinfo/prices']?.get?.responses?.['200']?.content?.[
          'application/json'
        ]?.schema;

      pricesSchema?.items?.$ref.should.equal(
        '#/components/schemas/WFInfoPriceItemDto',
      );
    });
  });
});
