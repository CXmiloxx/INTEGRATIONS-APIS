import { Injectable, Logger } from '@nestjs/common';
import axios, {
  AxiosInstance,
  AxiosError,
  AxiosResponse,
  AxiosRequestHeaders,
} from 'axios';
import { getAxiosConfig, getDefaultHeaders } from './http-client.config';

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

  /**
   * Obtiene o crea una instancia de axios para un servicio específico
   * Las instancias se cachean para reutilización
   *
   * @param name - Nombre identificador de la instancia (ej: 'adres', 'external-api')
   * @param baseURL - URL base para la instancia (opcional)
   * @returns Instancia de axios configurada
   */
  getClient(name: string, baseURL?: string): AxiosInstance {
    // Retornar instancia existente si ya está creada
    if (this.instances.has(name)) {
      return this.instances.get(name)!;
    }

    // Crear nueva instancia
    const config = {
      ...getAxiosConfig(),
      ...(baseURL && { baseURL }),
    };

    const instance = axios.create(config);

    // ✅ Interceptor de request - Logging
    instance.interceptors.request.use(
      (config) => {
        this.logger.debug(
          `📤 [${name}] ${config.method?.toUpperCase()} ${config.url}`,
        );

        // Merge con headers por defecto
        const defaultHeaders = getDefaultHeaders();
        config.headers = {
          ...defaultHeaders,
          ...(config.headers || {}),
        } as unknown as AxiosRequestHeaders;

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
    this.logger.log(`🗑️ Instancia '${name}' eliminada`);
  }

  /**
   * Limpia todas las instancias
   */
  clearAll(): void {
    this.instances.clear();
    this.logger.log(`🗑️ Todas las instancias han sido eliminadas`);
  }

  /**
   * Obtiene la lista de instancias disponibles
   */
  getAvailableClients(): string[] {
    return Array.from(this.instances.keys());
  }
}
