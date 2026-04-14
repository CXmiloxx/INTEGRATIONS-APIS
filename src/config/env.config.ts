import { registerAs } from '@nestjs/config';
import { AppConfigType } from './types/config.types';

export const appConfig = registerAs<AppConfigType>('app', () => {
  const port = parseInt(process.env.PORT ?? '3001', 10);
  const nodeEnv = process.env.NODE_ENV ?? 'development';
  const allowedOrigins = process.env.ALLOWED_ORIGINS
    ? process.env.ALLOWED_ORIGINS.split(',')
        .map((origin) => origin.trim())
        .filter((origin) => origin.length > 0)
    : ['*'];

  return {
    port,
    nodeEnv,
    urls: {
      adresApi: process.env.ADRES_API_URL ?? '',
      asoPagosApi: process.env.ASO_PAGOS_API_URL ?? '',
      urlApi: process.env.URL_API ?? '',
    },
    cors: {
      allowedOrigins,
    },
    security: {
      radScriptManager: process.env.RAD_SCRIPT_MANAGER ?? '',
      eventTarget: process.env.EVENT_TARGET ?? '',
      viewState: process.env.VIEW_STATE ?? '',
      viewStateGenerator: process.env.VIEW_STATE_GENERATOR ?? '',
      eventValidation: process.env.EVENT_VALIDATION ?? '',
    },
  };
});
