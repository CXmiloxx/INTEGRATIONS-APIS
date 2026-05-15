export interface AppConfigType {
  port: number;
  nodeEnv: 'development' | 'production' | 'test';

  // Server
  cors: {
    allowedOrigins: string[];
  };

  // Services grouped by provider
  services: {
    adres: {
      url: string;
    };
    asoPagos: {
      url: string;
    };
    sisben: {
      url: string;
    };
  };

  // Resource limits
  resources: {
    playwright: {
      maxConcurrency: number;
      headless: boolean;
      navigationTimeoutMs: number;
    };
  };
}

export interface ConfigSchema {
  app: AppConfigType;
}
