import { Injectable, Logger } from '@nestjs/common';
import axios, {
  AxiosInstance,
  AxiosError,
  AxiosResponse,
  AxiosRequestHeaders,
  RawAxiosResponseHeaders,
} from 'axios';
import { getAxiosConfig, getDefaultHeaders } from './http-client.config';
import { HttpClientAdapter } from './adapters/http-client-adapter.interface';
import { DefaultHttpClientAdapter } from './adapters/default-http-client.adapter';

/**
 * Interfaz para respuestas de error detalladas
 */
export interface HttpErrorResponse {
  statusCode: number;
  message: string;
  error: string;
  timestamp: string;
  path?: string;
}

/**
 * Servicio centralizado para gestionar instancias de axios
 * Proporciona:
 * - Creación de instancias reutilizables
 * - Interceptores para logging
 * - Manejo estandarizado de errores
 * - Headers por defecto
 */
@Injectable()
export class HttpClientService {
  private readonly logger = new Logger(HttpClientService.name);
  private instances: Map<string, AxiosInstance> = new Map();
  private readonly cookieJar: Map<string, string> = new Map();

  /**
   * Obtiene o crea una instancia de axios para un servicio específico
   * Las instancias se cachean para reutilización
   *
   * @param name - Nombre identificador de la instancia (ej: 'adres', 'external-api')
   * @param baseURL - URL base para la instancia (opcional)
   * @returns Instancia de axios configurada
   */
  getClient(name: string, baseURL?: string): AxiosInstance;
  getClient(adapter: HttpClientAdapter): AxiosInstance;
  getClient(
    nameOrAdapter: string | HttpClientAdapter,
    baseURL?: string,
  ): AxiosInstance {
    const adapter =
      typeof nameOrAdapter === 'string'
        ? new DefaultHttpClientAdapter(nameOrAdapter, baseURL)
        : nameOrAdapter;
    const name = adapter.name;

    // Retornar instancia existente si ya está creada
    if (this.instances.has(name)) {
      return this.instances.get(name)!;
    }

    // Crear nueva instancia
    const adapterConfig = adapter.getAxiosConfig?.() ?? {};
    const config = {
      ...getAxiosConfig(),
      ...adapterConfig,
      ...(adapter.baseURL && { baseURL: adapter.baseURL }),
      ...(adapter.timeout && { timeout: adapter.timeout }),
    };

    const instance = axios.create(config);

    // ✅ Interceptor de request - Logging
    instance.interceptors.request.use(
      (config) => {
        this.logger.debug(
          `📤 [${name}] ${config.method?.toUpperCase()} ${config.url}`,
        );

        // Merge con headers por defecto + headers del adapter
        const defaultHeaders = {
          ...getDefaultHeaders(),
          ...(adapter.getDefaultHeaders?.() ?? {}),
        };
        config.headers = {
          ...defaultHeaders,
          ...(config.headers || {}),
        } as unknown as AxiosRequestHeaders;

        // Adjuntar cookies persistidas si el adapter lo requiere
        if (adapter.shouldPersistCookies?.()) {
          const storedCookies = this.cookieJar.get(name);
          if (storedCookies) {
            config.headers = {
              ...(config.headers || {}),
              Cookie: storedCookies,
            } as unknown as AxiosRequestHeaders;
          }
        }

        return config;
      },
      (error) => {
        this.logger.error(
          `❌ [${name}] Error en request: ${(error as Error).message}`,
        );
        return Promise.reject(error as Error);
      },
    );

    // ✅ Interceptor de response - Logging y manejo de errores
    instance.interceptors.response.use(
      (response: AxiosResponse) => {
        const { status, statusText } = response;
        this.logger.debug(`✅ [${name}] Response ${status} ${statusText}`);

        // Persistir cookies por cliente cuando el adapter lo requiera
        if (adapter.shouldPersistCookies?.()) {
          this.persistCookiesFromResponse(name, response.headers);
        }

        return response;
      },
      (error: AxiosError) => {
        const statusCode = error.response?.status || 0;
        const data = error.response?.data;

        this.logger.error(
          `❌ [${name}] Error ${statusCode}: ${JSON.stringify(data)}`,
          {
            url: error.config?.url,
            method: error.config?.method,
            data,
          },
        );

        // Enriquecer el error con información útil
        const enrichedError: HttpErrorResponse = {
          statusCode,
          message: error.message,
          error: error.message,
          timestamp: new Date().toISOString(),
        };

        return Promise.reject(new Error(JSON.stringify(enrichedError)));
      },
    );

    // Guardar instancia para reutilización
    this.instances.set(name, instance);

    this.logger.log(`✅ Instancia '${name}' creada con éxito`);

    return instance;
  }

  /**
   * Obtiene una instancia existente sin crear una nueva
   * @param name - Nombre de la instancia
   */
  hasClient(name: string): boolean {
    return this.instances.has(name);
  }

  /**
   * Elimina una instancia del caché
   * @param name - Nombre de la instancia a eliminar
   */
  deleteClient(name: string): void {
    this.instances.delete(name);
    this.cookieJar.delete(name);
    this.logger.log(`🗑️ Instancia '${name}' eliminada`);
  }

  /**
   * Limpia todas las instancias
   */
  clearAll(): void {
    this.instances.clear();
    this.cookieJar.clear();
    this.logger.log(`🗑️ Todas las instancias han sido eliminadas`);
  }

  /**
   * Obtiene la lista de instancias disponibles
   */
  getAvailableClients(): string[] {
    return Array.from(this.instances.keys());
  }

  getCookies(clientName: string): string {
    return this.cookieJar.get(clientName) ?? '';
  }

  setCookies(clientName: string, cookies: string): void {
    if (!cookies) return;
    this.cookieJar.set(clientName, cookies);
  }

  clearCookies(clientName: string): void {
    this.cookieJar.delete(clientName);
  }

  extractCookiesFromHeaders(
    headers: RawAxiosResponseHeaders | Record<string, unknown>,
  ): string {
    const rawCookies = headers['set-cookie'];
    if (!rawCookies) {
      return '';
    }

    const setCookie = Array.isArray(rawCookies) ? rawCookies : [rawCookies];
    return setCookie
      .map((cookie) => String(cookie).split(';')[0]?.trim())
      .filter(Boolean)
      .join('; ');
  }

  private persistCookiesFromResponse(
    clientName: string,
    headers: RawAxiosResponseHeaders | Record<string, unknown>,
  ): void {
    const cookies = this.extractCookiesFromHeaders(headers);
    if (!cookies) {
      return;
    }

    this.cookieJar.set(clientName, cookies);
    this.logger.debug(`🍪 [${clientName}] Cookies de sesión actualizadas`);
  }
}
