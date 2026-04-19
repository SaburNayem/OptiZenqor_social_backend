import 'reflect-metadata';

import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';

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

  const swaggerDocument = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('docs', app, swaggerDocument, {
    swaggerOptions: {
      persistAuthorization: true,
    },
    jsonDocumentUrl: 'docs-json',
  });

  const port = Number(process.env.PORT ?? 3000);
  const host = process.env.HOST ?? '0.0.0.0';
  await app.listen(port, host);

  console.log(`API running at http://localhost:${port}`);
  console.log(`Swagger UI at http://localhost:${port}/docs`);
  console.log(`OpenAPI JSON at http://localhost:${port}/docs-json`);
}

bootstrap();
