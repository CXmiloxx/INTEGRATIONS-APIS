declare namespace NodeJS {
  interface ProcessEnv {
    PORT?: string;
    NODE_ENV?: 'development' | 'production' | 'test';
    ADRES_API_URL: string;
    ASO_PAGOS_API_URL: string;
    URL_API: string;
    ALLOWED_ORIGINS?: string;
    RAD_SCRIPT_MANAGER: string;
    EVENT_TARGET: string;
    VIEW_STATE: string;
    VIEW_STATE_GENERATOR: string;
    EVENT_VALIDATION: string;
  }
}
