import { NestFactory } from '@nestjs/core';
import { ValidationPipe, BadRequestException, Logger } from '@nestjs/common';
import { AppModule } from './app.module';
import { TypedConfigService } from './config/service/typed-config.service';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';

async function bootstrap() {
  const logger = new Logger('Bootstrap');
  const app = await NestFactory.create(AppModule);
  const configService = app.get(TypedConfigService);

  // ✅ Configuración mejorada de Swagger
  const swaggerConfig = new DocumentBuilder()
    .setTitle('API ADRES Integration')
    .setDescription(
      'API de integración con ADRES para consulta de información de afiliados al sistema de salud colombiano',
    )
    .setVersion('1.0.0')
    .setContact(
      'Soporte',
      'juancamilog9911@gmail.com',
      'juancamilog9911@gmail.com',
    )
    .setLicense('MIT', 'https://opensource.org/licenses/MIT')
    .addTag(
      'ADRES - Consulta de Afiliados',
      'Endpoints para consultar información de afiliados',
    )
    .addServer(
      `http://localhost:${configService.getPort()}/api/v1`,
      'Servidor Local',
    )
    .addServer(configService.getUrls().urlApi, 'Servidor de Producción')
    .build();

  const documentFactory = () =>
    SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('api/v1/docs', app, documentFactory, {
    swaggerOptions: {
      persistAuthorization: true,
      displayOperationId: true,
      url: `${configService.getUrls().urlApi}/api/v1/docs`,
      docExpansion: 'list',
    },
  });

  const port = configService.getPort();
  const urlApi = configService.getUrls().urlApi;
  const nodeEnv = configService.getNodeEnv();
  const allowedOrigins = configService.getAllowedOrigins();

  app.setGlobalPrefix('api/v1');

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
      exceptionFactory: (errors) => {
        const message = errors
          .map(
            (error) =>
              `${error.property}: ${Object.values(error.constraints || {}).join(', ')}`,
          )
          .join('; ');
        return new BadRequestException({
          statusCode: 400,
          message,
          error: 'Bad Request',
        });
      },
    }),
  );

  app.enableCors({
    origin: allowedOrigins,
    methods: ['GET', 'POST', 'OPTIONS'],
    credentials: true,
    allowedHeaders: ['Content-Type', 'Authorization'],
    maxAge: 3600,
  });

  await app.listen(port, '0.0.0.0');

  logger.log(`🚀 ADRES Service iniciado en http://localhost:${port}/api/v1`);
  logger.log(`📋 Ambiente: ${nodeEnv}`);
  logger.log(`📚 Documentación Swagger: ${urlApi}/api/v1/docs`);
}

bootstrap().catch((error) => {
  console.error('Error fatal al iniciar la aplicación:', error);
  process.exit(1);
});
