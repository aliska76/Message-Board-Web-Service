import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe, BadRequestException } from '@nestjs/common';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { NestExpressApplication } from '@nestjs/platform-express';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  // Global Validation Pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // Add fields didn't mentioned in DTO
      forbidNonWhitelisted: true,
      transform: true,
      disableErrorMessages: process.env.NODE_ENV === 'production', // Hide error detailes in production
      exceptionFactory: (errors) => {
        const messages = errors.map(error => {
          return Object.values(error.constraints).join(', ');
        });
        return new BadRequestException(messages);
      },
    }),
  );

  app.useGlobalFilters(new HttpExceptionFilter());
  
  // Trust proxy - only for production behind Nginx/Cloudflare
  if (process.env.NODE_ENV === 'production') {
    app.set('trust proxy', 1);
  }

  // SWAGGER configuration
  const config = new DocumentBuilder()
    .setTitle('Message Board API')
    .setDescription('API for message board application')
    .setVersion('1.0')
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document);

  const port = process.env.PORT ?? 3000;
  console.log(`Swagger documentation available at http://localhost:${port}/api`);

  await app.listen(port);

  console.log(`Application running on: http://localhost:${port}`);
}
bootstrap();