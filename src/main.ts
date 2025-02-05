import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { CORS_CONFIG } from './utils/common.constant';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.useGlobalPipes(
    new ValidationPipe({
      transform: true, // Enable transformation
      whitelist: true, // Strip unknown properties
    }),
  );
  app.enableCors(CORS_CONFIG);
  const config = new DocumentBuilder()
    .setTitle('Lokal-AI')
    .setDescription('API documentation for Lokal-AI')
    .setVersion('1.0')
    .addTag('Lokal-AI')
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document);
  await app.listen(3001);
}
bootstrap();
