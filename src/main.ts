import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { CORS_CONFIG } from './utils/common.constant';
import cookieParser from 'cookie-parser';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      whitelist: true,
    }),
  );
  app.enableCors(CORS_CONFIG);

  app.use(cookieParser());

  const config = new DocumentBuilder()
    .setTitle(process.env.APP_TITLE || '')
    .setDescription(process.env.APP_DESCRIPTION || '')
    .setVersion(process.env.APP_VERSION || '')
    .addTag(process.env.APP_TAG || '')
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup(
    process.env.APP_SWAGGER_APP_PREFIX || '/api',
    app,
    document,
  );

  const port = parseInt(process.env.APP_PORT || '3000', 10);
  await app.listen(port, '0.0.0.0');
}
bootstrap();
