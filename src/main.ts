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

function parseCorsOrigins() {
  const configured = [
    process.env.CORS_ORIGINS,
    process.env.CORS_ORIGIN,
    process.env.FRONTEND_URL,
    process.env.CLIENT_URL,
  ]
    .filter((value): value is string => Boolean(value))
    .flatMap((value) => value.split(','))
    .map((value) => value.trim())
    .filter(Boolean);

  return configured.length > 0 ? [...new Set(configured)] : true;
}

function assertStartupEnv() {
  const requiredInProduction = ['DATABASE_URL'];
  const missing = requiredInProduction.filter((key) => !process.env[key]?.trim());
  if ((process.env.NODE_ENV ?? '').trim().toLowerCase() === 'production' && missing.length > 0) {
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
  }
}

async function bootstrap() {
  assertStartupEnv();
  const app = await NestFactory.create(AppModule);
  app.enableCors({
    origin: parseCorsOrigins(),
    credentials: true,
  });
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    }),
  );
  app.useGlobalFilters(new HttpExceptionFilter());
  const rateLimitWindowMs = Number(process.env.RATE_LIMIT_WINDOW_MS ?? 60_000);
  const rateLimitMax = Number(process.env.RATE_LIMIT_MAX ?? 120);
  const requestCounters = new Map<string, { count: number; resetAt: number }>();
  app.use((req: { ip?: string; path?: string }, res: any, next: () => void) => {
    if (req.path?.startsWith('/docs') || req.path?.startsWith('/swagger')) {
      next();
      return;
    }

    const key = req.ip ?? 'unknown';
    const now = Date.now();
    const current = requestCounters.get(key);
    if (!current || current.resetAt <= now) {
      requestCounters.set(key, { count: 1, resetAt: now + rateLimitWindowMs });
      next();
      return;
    }

    current.count += 1;
    if (current.count > rateLimitMax) {
      res.status(429).json({
        success: false,
        message: 'Too many requests. Please try again later.',
      });
      return;
    }

    next();
  });

  const swaggerBuilder = new DocumentBuilder()
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
        bearerFormat: 'session-token',
        description:
          'Opaque bearer session token. Get it from /auth/login.',
      },
      'user-bearer',
    )
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'session-token',
        description:
          'Admin bearer token. Get it from /admin/auth/login. Demo admin password is admin123.',
      },
      'admin-bearer',
    );

  const vercelUrl = process.env.VERCEL_URL?.trim();
  if (vercelUrl) {
    const normalizedVercelUrl = /^https?:\/\//i.test(vercelUrl)
      ? vercelUrl
      : `https://${vercelUrl}`;
    swaggerBuilder.addServer(normalizedVercelUrl, 'Vercel deployment');
  }

  const swaggerConfig = swaggerBuilder.build();

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
  const swaggerUiOptions = {
    explorer: true,
    swaggerOptions: {
      persistAuthorization: true,
      displayRequestDuration: true,
      docExpansion: 'list',
      tagsSorter: 'alpha',
      operationsSorter: 'alpha',
    },
    customSiteTitle: 'OptiZenqor Social Backend Docs',
  };

  SwaggerModule.setup('docs', app, swaggerDocument, {
    ...swaggerUiOptions,
    jsonDocumentUrl: 'docs-json',
    yamlDocumentUrl: 'docs-yaml',
  });
  SwaggerModule.setup('swagger', app, swaggerDocument, {
    ...swaggerUiOptions,
    jsonDocumentUrl: 'swagger-json',
    yamlDocumentUrl: 'swagger-yaml',
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
  app.getHttpAdapter().get('/swagger-online', (_req, res) => {
    res.type('html').send(
      docsOnlineHtml
        .replace('/docs-json', '/swagger-json')
        .replace('/docs-json', '/swagger-json'),
    );
  });

  const port = Number(process.env.PORT ?? 3000);
  const host = process.env.HOST ?? '0.0.0.0';
  await app.listen(port, host);

  console.log(`API running at http://localhost:${port}`);
  console.log(`Swagger UI at http://localhost:${port}/docs`);
  console.log(`Swagger alias at http://localhost:${port}/swagger`);
  console.log(`Public-friendly Swagger UI at http://localhost:${port}/docs-online`);
  console.log(`OpenAPI JSON at http://localhost:${port}/docs-json`);
}

bootstrap();
