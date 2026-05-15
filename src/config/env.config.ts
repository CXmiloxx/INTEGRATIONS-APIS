import { registerAs } from '@nestjs/config';
import { AppConfigType } from './types/config.types';

/**
 * Configuración centralizada - Estructura por servicios
 */
export const appConfig = registerAs<AppConfigType>('app', () => {
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // SERVER
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  const port = parseInt(process.env.PORT ?? '3001', 10);
  const nodeEnv = process.env.NODE_ENV ?? 'development';
  const allowedOrigins = process.env.ALLOWED_ORIGINS
    ? process.env.ALLOWED_ORIGINS.split(',')
        .map((origin) => origin.trim())
        .filter((origin) => origin.length > 0)
    : ['*'];

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // SERVICIO ADRES
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  const adresUrl = process.env.ADRES_API_URL ?? '';

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // SERVICIO ASO PAGOS
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  const asoPagosUrl = process.env.ASO_PAGOS_API_URL ?? '';

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // SERVICIO SISBEN
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  const sisbenUrl = process.env.SISBEN_URL ?? '';

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // RECURSOS (Playwright, OCR, HTTP)
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  const playwrightMaxConcurrency = parseInt(
    process.env.PLAYWRIGHT_MAX_CONCURRENCY ?? '5',
    10,
  );
  const playwrightHeadless =
    (process.env.PLAYWRIGHT_HEADLESS ?? 'true') !== 'false';
  const playwrightNavTimeoutMs = parseInt(
    process.env.PLAYWRIGHT_NAV_TIMEOUT_MS ?? '30000',
    10,
  );

  return {
    // ▸ Server
    port,
    nodeEnv,
    cors: { allowedOrigins },

    // ▸ Servicio ADRES (URL + tokens ASP.NET)
    services: {
      adres: {
        url: adresUrl,
      },
      asoPagos: {
        url: asoPagosUrl,
      },
      sisben: {
        url: sisbenUrl,
      },
    },

    // ▸ Recursos
    resources: {
      playwright: {
        maxConcurrency: playwrightMaxConcurrency,
        headless: playwrightHeadless,
        navigationTimeoutMs: playwrightNavTimeoutMs,
      },
    },
  };
});
