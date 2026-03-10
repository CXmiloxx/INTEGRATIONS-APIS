import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ConfigSchema } from '../types/config.types';

@Injectable()
export class TypedConfigService extends ConfigService<ConfigSchema> {
  //Obtiene la configuracion de la aplicacion
  getAppConfig(): ConfigSchema['app'] {
    const config = this.get<ConfigSchema['app']>('app');
    if (!config) {
      throw new Error('El archivo de configuracion no esta disponible');
    }
    return config;
  }

  getPort(): number {
    return this.getAppConfig().port;
  }

  getNodeEnv(): 'development' | 'production' | 'test' {
    return this.getAppConfig().nodeEnv;
  }

  getUrls() {
    return this.getAppConfig().urls;
  }

  getAllowedOrigins(): string[] {
    return this.getAppConfig().cors.allowedOrigins;
  }

  getSecurityConfig() {
    return this.getAppConfig().security;
  }
}
