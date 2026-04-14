import { AxiosRequestConfig } from 'axios';

export interface HttpClientAdapter {
  name: string;
  baseURL?: string;
  timeout?: number;

  getAxiosConfig?(): AxiosRequestConfig;
  getDefaultHeaders?(): Record<string, string>;
  shouldPersistCookies?(): boolean;
}
