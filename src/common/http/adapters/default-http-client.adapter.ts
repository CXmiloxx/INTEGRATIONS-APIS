import { AxiosRequestConfig } from 'axios';
import { getAxiosConfig, getDefaultHeaders } from '../http-client.config';
import { HttpClientAdapter } from './http-client-adapter.interface';

export class DefaultHttpClientAdapter implements HttpClientAdapter {
  readonly timeout?: number;

  constructor(
    public readonly name: string,
    public readonly baseURL?: string,
    timeout?: number,
  ) {
    this.timeout = timeout;
  }

  getAxiosConfig(): AxiosRequestConfig {
    return getAxiosConfig();
  }

  getDefaultHeaders(): Record<string, string> {
    return getDefaultHeaders();
  }

  shouldPersistCookies(): boolean {
    return false;
  }
}
