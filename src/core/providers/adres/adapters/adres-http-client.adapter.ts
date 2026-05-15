import { AxiosRequestConfig } from 'axios';
import { getDefaultHeaders } from 'src/common';
import { HttpClientAdapter } from 'src/common/http/adapters/http-client-adapter.interface';

type AdresEndpoint =
  | 'ConsultarAfiliadoWeb_2.aspx'
  | 'RespuestaConsulta.aspx'
  | 'default';

export class AdresHttpClientAdapter implements HttpClientAdapter {
  readonly name = 'adres';
  readonly timeout = 30000;

  private readonly refererMap: Record<AdresEndpoint, string> = {
    'ConsultarAfiliadoWeb_2.aspx':
      'https://aplicaciones.adres.gov.co/BDUA_Internet/Pages/ConsultarAfiliadoWeb_2.aspx',
    'RespuestaConsulta.aspx':
      'https://servicios.adres.gov.co/BDUA/Consulta-Afiliados-BDUA',
    default: 'https://www.adres.gov.co/consulte-su-eps',
  };

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
      Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      'Accept-Language': 'es-CO,es;q=0.9',
      Origin: 'https://www.adres.gov.co',
      Referer: this.refererMap.default,
    };
  }

  getHeadersForEndpoint(endpoint: AdresEndpoint): Record<string, string> {
    return {
      ...this.getDefaultHeaders(),
      Referer: this.refererMap[endpoint] || this.refererMap.default,
    };
  }

  shouldPersistCookies(): boolean {
    return true;
  }
}
