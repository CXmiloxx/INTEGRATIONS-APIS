import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import Joi from 'joi';
import { AdresModule } from './core/adres/adres.module';
import { appConfig } from './config/env.config';
import { TypedConfigService } from './config/service/typed-config.service';
import { HttpModule } from './common/http';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env.local', '.env'],
      load: [appConfig],
      validationSchema: Joi.object({
        PORT: Joi.number().optional().default(3001),
        NODE_ENV: Joi.string()
          .valid('development', 'production', 'test')
          .optional()
          .default('development'),
        ADRES_API_URL: Joi.string().required(),
        ALLOWED_ORIGINS: Joi.string().optional(),
        RAD_SCRIPT_MANAGER: Joi.string().required(),
        EVENT_TARGET: Joi.string().required(),
        VIEW_STATE: Joi.string().required(),
        VIEW_STATE_GENERATOR: Joi.string().required(),
        EVENT_VALIDATION: Joi.string().required(),
      }),
      validationOptions: {
        abortEarly: false,
        stripUnknown: true,
      },
    }),
    HttpModule,
    AdresModule,
  ],
  providers: [TypedConfigService],
  exports: [TypedConfigService],
})
export class AppModule {}
