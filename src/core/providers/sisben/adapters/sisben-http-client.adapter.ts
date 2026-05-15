import { AxiosRequestConfig } from 'axios';
import { HttpClientAdapter } from 'src/common/http/adapters/http-client-adapter.interface';

export class SisbenHttpClientAdapter implements HttpClientAdapter {
  readonly name = 'sisben';
  readonly timeout = 30000;

  constructor(public readonly baseURL: string) {}

  getAxiosConfig(): AxiosRequestConfig {
    return {
      maxRedirects: 5,
      validateStatus: () => true,
    };
  }

  getDefaultHeaders(): Record<string, string> {
    return {
      // Origin no incluye path (RFC 6454); un Origin inválido puede romper antiforgery.
      Origin: 'https://reportes.sisben.gov.co',
      Referer: 'https://reportes.sisben.gov.co/dnp_sisbenconsulta',
      Accept:
        'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
      'Accept-Language': 'es-CO,es;q=0.9,en;q=0.8',
      'Upgrade-Insecure-Requests': '1',
      'Cache-Control': 'max-age=0',
      'User-Agent':
        'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36 Edg/147.0.0.0',
    };
  }

  shouldPersistCookies(): boolean {
    return true; // Persistir cookies para mantener sesión
  }
}
