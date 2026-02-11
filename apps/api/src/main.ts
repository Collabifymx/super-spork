import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { ConfigService } from '@nestjs/config';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import { AppModule } from './app.module';

async function bootstrap() {
  const logger = new Logger('Bootstrap');
  const app = await NestFactory.create(AppModule, {
    logger: ['error', 'warn', 'log', 'debug', 'verbose'],
  });

  const configService = app.get(ConfigService);
  const port = configService.get('PORT', 4000);
  const corsOrigins = configService.get('CORS_ORIGINS', 'http://localhost:3000');

  // Security
  app.use(helmet());
  app.use(cookieParser());
  app.enableCors({
    origin: corsOrigins.split(','),
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  });

  // Global prefix
  app.setGlobalPrefix('api');

  // Validation
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );

  // Swagger
  const swaggerConfig = new DocumentBuilder()
    .setTitle('Collabify API')
    .setDescription('UGC & Influencer Marketplace API')
    .setVersion('1.0')
    .addBearerAuth()
    .addTag('auth', 'Authentication endpoints')
    .addTag('users', 'User management')
    .addTag('brands', 'Brand management')
    .addTag('creators', 'Creator profiles')
    .addTag('campaigns', 'Campaign management')
    .addTag('applications', 'Applications & proposals')
    .addTag('contracts', 'Contracts')
    .addTag('chat', 'Chat & messaging')
    .addTag('deliverables', 'Deliverables & reviews')
    .addTag('payments', 'Payments & ledger')
    .addTag('subscriptions', 'Subscriptions & billing')
    .addTag('admin', 'Admin panel')
    .addTag('search', 'Search & discovery')
    .build();

  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('api/docs', app, document);

  await app.listen(port);
  logger.log(`🚀 Collabify API running on http://localhost:${port}`);
  logger.log(`📚 Swagger docs at http://localhost:${port}/api/docs`);
}
bootstrap();
