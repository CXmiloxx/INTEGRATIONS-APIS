import { AxiosRequestConfig } from 'axios';
import { HttpClientAdapter } from 'src/common/http/adapters/http-client-adapter.interface';

export class AsoPagosHttpClientAdapter implements HttpClientAdapter {
  readonly name = 'asoPagos';
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
      Origin: 'https://www.enlace-apb.com',
      Referer:
        'https://www.enlace-apb.com/interssi/descargarCertificacionPago.jsp',
      'Content-Type': 'application/x-www-form-urlencoded',
      Accept: '*/*',
      'X-Requested-With': 'XMLHttpRequest',
      'User-Agent':
        'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/146.0.0.0 Safari/537.36 Edg/146.0.0.0',
    };
  }

  shouldPersistCookies(): boolean {
    return true; // Persistir cookies para mantener sesión
  }
}
