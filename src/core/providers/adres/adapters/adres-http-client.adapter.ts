import { AxiosRequestConfig } from 'axios';
import { getDefaultHeaders } from 'src/common';
import { HttpClientAdapter } from 'src/common/http/adapters/http-client-adapter.interface';

export class AdresHttpClientAdapter implements HttpClientAdapter {
  readonly name = 'adres';
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
      ...getDefaultHeaders(),
      Origin: 'https://www.adres.gov.co',
      Referer: 'https://www.adres.gov.co/consulte-su-eps',
    };
  }

  shouldPersistCookies(): boolean {
    return true;
  }
}
