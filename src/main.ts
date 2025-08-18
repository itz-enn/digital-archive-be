import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import helmet from 'helmet';
import { NestExpressApplication } from '@nestjs/platform-express';
import envConfig from './utils/config/env.config';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import * as cookieParser from 'cookie-parser';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  app.enableCors({
    origin: [envConfig.frontendUrl, 'http://localhost:5173'],
    methods: 'GET,PATCH,POST,DELETE',
    credentials: true,
  });

  app.use(cookieParser());

  app.setGlobalPrefix('api');

  // Swagger setup
  const config = new DocumentBuilder()
    .setTitle('Digital Archive API')
    .setDescription(
      'The api documentation for Digital Archives of Final Year Projects',
    )
    .setVersion('1.0')
    .addTag('auth')
    .addTag('admin')
    .addTag('user')
    .addTag('supervisor')
    .addTag('student')
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  app.use(helmet());

  // Enable global validation
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  await app.listen(3000);
}
bootstrap();
