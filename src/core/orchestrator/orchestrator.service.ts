import {
  Injectable,
  Logger,
  InternalServerErrorException,
} from '@nestjs/common';
import { AdresService } from '../providers/adres/adres.service';
import { AsoPagosService } from '../providers/aso-pagos/aso-pagos.service';
import { CitizenInfoDTO } from 'src/common/dto/citizen-info.dto';
import { BuscarAfiliado } from '../providers/adres/dto/buscar-afiliado.dto';
import { Provider } from 'src/common/interfaces/provider.interface';

interface ProviderExecutionResult {
  name: string;
  provider: Provider;
  success: boolean;
  data?: unknown;
  error?: string;
}

@Injectable()
export class OrchestratorService {
  private readonly logger = new Logger(OrchestratorService.name);
  private readonly providers: Map<string, Provider> = new Map();

  constructor(
    private readonly adresService: AdresService,
    private readonly asoPagosService: AsoPagosService,
  ) {
    this.initializeProviders();
  }

  /**
   * Inicializa el registro de providers
   * Nuevo patrón: agnóstico a la cantidad de providers
   */
  private initializeProviders(): void {
    this.registerProvider(this.adresService);
    this.registerProvider(this.asoPagosService);
  }

  /**
   * Registra un nuevo provider en el orquestador
   * @param provider - Instancia del provider que implementa la interfaz Provider
   */
  private registerProvider(provider: Provider): void {
    this.providers.set(provider.name, provider);
    this.logger.log(`✅ Provider registrado: ${provider.name}`);
  }

  /**
   * Obtiene todos los providers registrados
   */
  getRegisteredProviders(): string[] {
    return Array.from(this.providers.keys());
  }

  /**
   * Ejecuta todos los providers en paralelo de forma escalable
   * No depende de posiciones de array, funciona con cualquier cantidad de providers
   */
  async obtenerInfoCiudadano(
    buscarAfiliadoDto: BuscarAfiliado,
  ): Promise<CitizenInfoDTO> {
    const providerCount = this.providers.size;
    this.logger.log(
      `Orquestando consulta para cédula: ${buscarAfiliadoDto.numDoc} usando ${providerCount} provider(s): [${this.getRegisteredProviders().join(', ')}]`,
    );

    try {
      // Ejecutar todos los providers en paralelo
      const providerEntries = Array.from(this.providers.entries());
      const executionResults: ProviderExecutionResult[] = [];

      const results = await Promise.allSettled(
        providerEntries.map(([name, provider]) =>
          this.executeProvider(name, provider, buscarAfiliadoDto),
        ),
      );

      // Procesar resultados
      for (const result of results) {
        if (result.status === 'fulfilled') {
          executionResults.push(result.value);
        } else if (result.status === 'rejected') {
          const errorMsg =
            result.reason instanceof Error
              ? result.reason.message
              : String(result.reason);
          this.logger.warn(`⚠️ Provider falló: ${errorMsg}`);
        }
      }

      // Filtrar resultados exitosos
      const successfulResults = executionResults.filter((r) => r.success);

      if (successfulResults.length === 0) {
        this.logger.error(
          '❌ No se obtuvieron datos de ningún provider disponible',
        );
        throw new InternalServerErrorException(
          'No se pudo obtener información del ciudadano de los proveedores disponibles',
        );
      }

      // Normalizar datos de cada provider exitoso
      const datosNormalizados: Partial<CitizenInfoDTO>[] = [];

      for (const execResult of successfulResults) {
        try {
          if (execResult.data) {
            const normalizado = execResult.provider.normalize(execResult.data);
            datosNormalizados.push(normalizado);
            this.logger.log(
              `✅ Datos normalizados del provider: ${execResult.name}`,
            );
          }
        } catch (normalizeError: unknown) {
          const errorMsg =
            normalizeError instanceof Error
              ? normalizeError.message
              : String(normalizeError);
          this.logger.warn(
            `⚠️ Error normalizando datos del provider ${execResult.name}: ${errorMsg}`,
          );
        }
      }

      // Ensamblar respuesta final con todos los datos
      const respuestaFinal = this.ensamblarRespuesta(datosNormalizados);

      this.logger.log(
        `✅ Información de ciudadano obtenida exitosamente desde ${datosNormalizados.length}/${providerCount} provider(s)`,
      );

      return respuestaFinal;
    } catch (orchestrationError: unknown) {
      const errorMsg =
        orchestrationError instanceof Error
          ? orchestrationError.message
          : String(orchestrationError);
      this.logger.error(`❌ Error en orquestación: ${errorMsg}`);
      throw orchestrationError;
    }
  }

  /**
   * Ejecuta un provider individual y captura su resultado
   */
  private async executeProvider(
    name: string,
    provider: Provider,
    buscarAfiliadoDto: BuscarAfiliado,
  ): Promise<ProviderExecutionResult> {
    try {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      const data = await provider.getData(
        buscarAfiliadoDto.numDoc,
        buscarAfiliadoDto.tipoDoc,
      );

      this.logger.log(`✅ Provider ${name} ejecutado exitosamente`);

      return {
        name,
        provider,
        success: true,
        data,
      };
    } catch (error: unknown) {
      const errorMsg = error instanceof Error ? error.message : String(error);

      this.logger.warn(`⚠️ Provider ${name} falló: ${errorMsg}`);

      return {
        name,
        provider,
        success: false,
        error: errorMsg,
      };
    }
  }

  /**
   * Ensambla la respuesta final fusionando datos de múltiples providers
   * Completamente agnóstico al número y tipo de providers
   */
  private ensamblarRespuesta(
    datosNormalizados: Partial<CitizenInfoDTO>[],
  ): CitizenInfoDTO {
    const respuesta: CitizenInfoDTO = {};

    // Fusionar datos de todos los providers de forma segura
    for (const dato of datosNormalizados) {
      // Fusionar datos de ADRES
      if (dato.adres) {
        respuesta.adres = {
          ...respuesta.adres,
          ...dato.adres,
        };
      }

      // Fusionar datos de Aso Pagos
      if (dato.asoPagos) {
        respuesta.asoPagos = {
          ...respuesta.asoPagos,
          ...dato.asoPagos,
        };
      }

      // Usar el timestamp más reciente
      if (dato.fechaProcesamiento) {
        respuesta.fechaProcesamiento = dato.fechaProcesamiento;
      }
    }

    // Asignar timestamp de procesamiento si no existe
    if (!respuesta.fechaProcesamiento) {
      respuesta.fechaProcesamiento = new Date().toISOString();
    }

    this.logger.log('🔗 Respuesta ensamblada exitosamente');

    return respuesta;
  }
}
