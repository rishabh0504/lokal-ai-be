import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { CORS_CONFIG } from './utils/common.constant';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
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
