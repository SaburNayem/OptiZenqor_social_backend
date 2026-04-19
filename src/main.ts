import 'reflect-metadata';

import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.enableCors();

  const swaggerConfig = new DocumentBuilder()
    .setTitle('OptiZenqor Social Backend API')
    .setDescription(
      'Interactive API documentation for the OptiZenqor social app and admin dashboard backend.',
    )
    .setVersion('1.0.0')
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
