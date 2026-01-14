import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { AppModule } from './app.module';
import { LoggerService } from './common/logger/logger.service';
import { LoggingInterceptor } from './common/interceptors/logging.interceptor';
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    bufferLogs: true,
  });

  // Get logger instance
  const logger = app.get(LoggerService);

  // Use custom logger for the application
  app.useLogger(logger);

  // Enable CORS for frontend
  app.enableCors({
    origin: [
      'http://localhost:3000',
      'http://localhost:3001',
      process.env.FRONTEND_URL || 'http://localhost:3000',
    ],
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    credentials: true,
  });

  // Increase payload limit for CSV uploads
  app.useBodyParser('json', { limit: '50mb' });
  app.useBodyParser('urlencoded', { limit: '50mb', extended: true });

  // Register global interceptor for request/response logging
  app.useGlobalInterceptors(new LoggingInterceptor(logger));

  // Register global exception filter
  app.useGlobalFilters(new AllExceptionsFilter(logger));

  const port = process.env.PORT ?? 3000;
  await app.listen(port);

  // Print startup banner
  logger.printBanner(port);
  logger.success(`Application is running on port ${port}`, 'Bootstrap');
}
bootstrap();
