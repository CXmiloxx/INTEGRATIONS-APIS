export interface AppConfigType {
  port: number;
  nodeEnv: 'development' | 'production' | 'test';
  urls: {
    adresApi: string;
    asoPagosApi: string;
    urlApi: string;
  };
  cors: {
    allowedOrigins: string[];
  };
  security: {
    radScriptManager: string;
    eventTarget: string;
    viewState: string;
    viewStateGenerator: string;
    eventValidation: string;
  };
}

export interface ConfigSchema {
  app: AppConfigType;
}
