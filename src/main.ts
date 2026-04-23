import 'reflect-metadata';

import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import {
  DocumentBuilder,
  SwaggerDocumentOptions,
  SwaggerModule,
} from '@nestjs/swagger';
import { AppModule } from './app.module';
import { HttpExceptionFilter } from './filters/http-exception.filter';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.enableCors();
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    }),
  );
  app.useGlobalFilters(new HttpExceptionFilter());

  const swaggerConfig = new DocumentBuilder()
    .setTitle('OptiZenqor Social Backend API')
    .setDescription(
      'Interactive API documentation for the OptiZenqor social app and admin dashboard backend.',
    )
    .setVersion('1.0.0')
    .addServer('/', 'Current server')
    .addServer('http://localhost:3000', 'Local development')
    .addServer('http://localhost:3001', 'Local development alternate port')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        description:
          'User bearer token. Get it from /auth/login. Demo user password is 123456.',
      },
      'user-bearer',
    )
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        description:
          'Admin bearer token. Get it from /admin/auth/login. Demo admin password is admin123.',
      },
      'admin-bearer',
    )
    .build();

  const swaggerDocumentOptions: SwaggerDocumentOptions = {
    deepScanRoutes: true,
    autoTagControllers: false,
    operationIdFactory: (_controllerKey: string, methodKey: string) => methodKey,
  };

  const swaggerDocument = SwaggerModule.createDocument(
    app,
    swaggerConfig,
    swaggerDocumentOptions,
  );
  SwaggerModule.setup('docs', app, swaggerDocument, {
    explorer: true,
    swaggerOptions: {
      persistAuthorization: true,
      displayRequestDuration: true,
      docExpansion: 'list',
      tagsSorter: 'alpha',
      operationsSorter: 'alpha',
    },
    jsonDocumentUrl: 'docs-json',
    yamlDocumentUrl: 'docs-yaml',
    customSiteTitle: 'OptiZenqor Social Backend Docs',
  });

  const docsOnlineHtml = `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>OptiZenqor Social Backend Docs</title>
    <link
      rel="stylesheet"
      href="https://unpkg.com/swagger-ui-dist@5/swagger-ui.css"
    />
    <style>
      html, body {
        margin: 0;
        background: #f4f7fb;
      }

      .topbar {
        display: none;
      }
    </style>
  </head>
  <body>
    <div id="swagger-ui"></div>
    <script src="https://unpkg.com/swagger-ui-dist@5/swagger-ui-bundle.js"></script>
    <script>
      window.ui = SwaggerUIBundle({
        url: '/docs-json',
        dom_id: '#swagger-ui',
        deepLinking: true,
        docExpansion: 'list',
        displayRequestDuration: true,
        persistAuthorization: true,
        presets: [SwaggerUIBundle.presets.apis],
      });
    </script>
  </body>
</html>`;

  app.getHttpAdapter().get('/docs-online', (_req, res) => {
    res.type('html').send(docsOnlineHtml);
  });

  const port = Number(process.env.PORT ?? 3000);
  const host = process.env.HOST ?? '0.0.0.0';
  await app.listen(port, host);

  console.log(`API running at http://localhost:${port}`);
  console.log(`Swagger UI at http://localhost:${port}/docs`);
  console.log(`Public-friendly Swagger UI at http://localhost:${port}/docs-online`);
  console.log(`OpenAPI JSON at http://localhost:${port}/docs-json`);
}

bootstrap();
