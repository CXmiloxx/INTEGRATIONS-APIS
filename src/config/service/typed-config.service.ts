import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ConfigSchema } from '../types/config.types';

@Injectable()
export class TypedConfigService extends ConfigService<ConfigSchema> {
  getAppConfig(): ConfigSchema['app'] {
    const config = this.get<ConfigSchema['app']>('app');
    if (!config) {
      throw new Error('Configuración no disponible');
    }
    return config;
  }

  getPort(): number {
    return this.getAppConfig().port;
  }

  getNodeEnv(): 'development' | 'production' | 'test' {
    return this.getAppConfig().nodeEnv;
  }

  getAllowedOrigins(): string[] {
    return this.getAppConfig().cors.allowedOrigins;
  }

  // ADRES service
  getAdresConfig() {
    return this.getAppConfig().services.adres;
  }

  getUrls() {
    return {
      adresApi: this.getAppConfig().services.adres.url,
      asoPagosApi: this.getAppConfig().services.asoPagos.url,
      urlApi: '',
    };
  }

  // AsoPagos service
  getAsoPagosConfig() {
    return this.getAppConfig().services.asoPagos;
  }

  // AsoPagos service
  getSisbenConfig() {
    return this.getAppConfig().services.sisben;
  }

  // Resources
  getResourceConfig() {
    return this.getAppConfig().resources;
  }
}
