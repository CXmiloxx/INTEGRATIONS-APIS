import { Injectable, Logger } from '@nestjs/common';
import { AdresService } from '../providers/adres/adres.service';
import { AsoPagosService } from '../providers/aso-pagos/aso-pagos.service';
import {
  AfiliacionDTO,
  AportanteDTO,
  CitizenResponseDTO,
  PersonaDTO,
  ProviderContribution,
  ProviderResponseStatus,
  ProviderStatusDTO,
} from 'src/common/dto/citizen-response.dto';
import { BuscarAfiliado } from '../providers/adres/dto/buscar-afiliado.dto';
import { Provider } from 'src/common/interfaces/provider.interface';
import { UserNotFoundError } from 'src/common/errors';

interface ProviderExecutionResult {
  name: string;
  responseKey: string;
  provider: Provider;
  success: boolean;
  data?: unknown;
  error?: string;
  userNotFound?: boolean;
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

  private initializeProviders(): void {
    this.registerProvider(this.adresService);
    this.registerProvider(this.asoPagosService);
  }

  private registerProvider(provider: Provider): void {
    this.providers.set(provider.name, provider);
    this.logger.log(`✅ Provider registrado: ${provider.name}`);
  }

  getRegisteredProviders(): string[] {
    return Array.from(this.providers.keys());
  }

  async obtenerInfoCiudadano(
    buscarAfiliadoDto: BuscarAfiliado,
  ): Promise<CitizenResponseDTO> {
    const providerCount = this.providers.size;
    this.logger.log(
      `Orquestando consulta para cédula: ${buscarAfiliadoDto.numDoc} usando ${providerCount} provider(s): [${this.getRegisteredProviders().join(', ')}]`,
    );

    const providerEntries = Array.from(this.providers.values());

    const settled = await Promise.allSettled(
      providerEntries.map((provider) =>
        this.executeProvider(provider, buscarAfiliadoDto),
      ),
    );

    const executionResults: ProviderExecutionResult[] = [];
    for (const result of settled) {
      if (result.status === 'fulfilled') {
        executionResults.push(result.value);
      } else {
        const errorMsg =
          result.reason instanceof Error
            ? result.reason.message
            : String(result.reason);
        this.logger.warn(`⚠️ Provider falló: ${errorMsg}`);
      }
    }

    const providers = this.buildProvidersStatus(executionResults);
    const data = this.mergeContributions(executionResults);

    const exitos = executionResults.filter((r) => r.success).length;
    this.logger.log(
      `✅ Información de ciudadano obtenida desde ${exitos}/${providerCount} provider(s)`,
    );

    return {
      meta: { timestamp: new Date().toISOString() },
      data,
      providers,
    };
  }

  private async executeProvider(
    provider: Provider,
    buscarAfiliadoDto: BuscarAfiliado,
  ): Promise<ProviderExecutionResult> {
    const { name, responseKey } = provider;
    try {
      const data = await provider.getData(
        buscarAfiliadoDto.numDoc,
        buscarAfiliadoDto.tipoDoc,
      );
      this.logger.log(`✅ Provider ${name} ejecutado exitosamente`);
      return { name, responseKey, provider, success: true, data };
    } catch (error: unknown) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      const userNotFound = error instanceof UserNotFoundError;

      if (userNotFound) {
        this.logger.warn(
          `🔍 Provider ${name}: usuario no encontrado - ${errorMsg}`,
        );
      } else {
        this.logger.warn(`⚠️ Provider ${name} falló: ${errorMsg}`);
      }

      return {
        name,
        responseKey,
        provider,
        success: false,
        error: errorMsg,
        userNotFound,
      };
    }
  }

  private buildProvidersStatus(
    executionResults: ProviderExecutionResult[],
  ): Record<string, ProviderStatusDTO> {
    const providers: Record<string, ProviderStatusDTO> = {};

    for (const result of executionResults) {
      let status: ProviderResponseStatus;
      let message: string | undefined;

      if (result.success) {
        status = 'success';
      } else if (result.userNotFound) {
        status = 'not_found';
        message = result.error ?? 'No se encontró información del usuario';
      } else {
        status = 'error';
        message = result.error ?? 'Error consultando el proveedor';
      }

      providers[result.responseKey] = message
        ? { status, message }
        : { status };
    }

    return providers;
  }

  /**
   * Recolecta la contribución de cada provider exitoso y las fusiona:
   * - `persona`: merge campo a campo, primer valor no vacío gana
   * - `afiliaciones`: concatenación
   * - `aportante`: primer aporte gana
   * El orquestador no conoce ni nombres ni esquemas de providers individuales.
   */
  private mergeContributions(
    executionResults: ProviderExecutionResult[],
  ): CitizenResponseDTO['data'] {
    let persona: PersonaDTO | null = null;
    const afiliaciones: AfiliacionDTO[] = [];
    let aportante: AportanteDTO | null = null;

    for (const result of executionResults) {
      if (!result.success || result.data == null) continue;

      let contribution: ProviderContribution;
      try {
        contribution = result.provider.toContribution(result.data);
      } catch (error: unknown) {
        const errorMsg = error instanceof Error ? error.message : String(error);
        this.logger.warn(
          `⚠️ Error normalizando contribución de ${result.name}: ${errorMsg}`,
        );
        continue;
      }

      if (contribution.persona) {
        persona = this.mergePersona(persona, contribution.persona);
      }
      if (contribution.afiliaciones?.length) {
        afiliaciones.push(...contribution.afiliaciones);
      }
      if (contribution.aportante && !aportante) {
        aportante = contribution.aportante;
      }
    }

    return { persona, afiliaciones, aportante };
  }

  private mergePersona(
    base: PersonaDTO | null,
    next: Partial<PersonaDTO>,
  ): PersonaDTO {
    const merged: PersonaDTO = base ?? { ubicacion: {} };

    merged.tipoIdentificacion ??= next.tipoIdentificacion;
    merged.numeroIdentificacion ??= next.numeroIdentificacion;
    merged.nombres ??= next.nombres;
    merged.apellidos ??= next.apellidos;
    if (merged.fechaNacimiento == null && next.fechaNacimiento != null) {
      merged.fechaNacimiento = next.fechaNacimiento;
    }

    if (next.ubicacion) {
      merged.ubicacion ??= {};
      merged.ubicacion.departamento ??= next.ubicacion.departamento;
      merged.ubicacion.municipio ??= next.ubicacion.municipio;
    }

    return merged;
  }
}
