import { AxiosRequestConfig } from 'axios';
import https from 'https';

/**
 * Configuración base para instancias de axios
 * Define timeouts, agentes HTTPS, y redirecciones
 */
export const getAxiosConfig = (): AxiosRequestConfig => {
  const httpsAgent = new https.Agent({
    rejectUnauthorized: false, // ⚠️ Solo para desarrollo, cambiar en producción
  });

  return {
    httpsAgent,
    httpAgent: new https.Agent({
      rejectUnauthorized: false, // ⚠️ Solo para desarrollo, cambiar en producción
    }),
    maxRedirects: 5,
    timeout: 30000, // 30 segundos
    validateStatus: (status) => status < 500, // No fallar con errores 4xx
  };
};

/**
 * Headers por defecto para las peticiones
 */
export const getDefaultHeaders = () => ({
  'User-Agent':
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Accept-Language': 'es-CO,es;q=0.9,en;q=0.8',
  Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
});

/**
 * Headers para form data (aplicaciones web)
 */
export const getFormDataHeaders = () => ({
  ...getDefaultHeaders(),
  'Content-Type': 'application/x-www-form-urlencoded',
});

/**
 * Headers para JSON
 */
export const getJsonHeaders = () => ({
  ...getDefaultHeaders(),
  'Content-Type': 'application/json',
});
