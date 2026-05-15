import {
  Injectable,
  BadRequestException,
  Logger,
  ServiceUnavailableException,
} from '@nestjs/common';
import { AxiosInstance } from 'axios';
import * as cheerio from 'cheerio';
import { SisbenDocumentType } from 'src/types/sisben.types';
import { TypedConfigService } from 'src/config';
import { HttpClientService } from 'src/common/http';
import { Provider } from 'src/common/interfaces/provider.interface';
import { ProviderContribution } from 'src/common/dto/citizen-response.dto';
import { UserNotFoundError } from 'src/common/errors';
import { SisbenHttpClientAdapter } from './adapters/sisben-http-client.adapter';
import { BuscarSisben } from './dto/buscar-sisben.dto';
import {
  SisbenConsultaResult,
  SisbenOficinaContacto,
} from './interfaces/sisben-consulta-result.interface';

type CheerioLoaded = ReturnType<typeof cheerio.load>;

@Injectable()
export class SisbenService implements Provider {
  private readonly logger = new Logger(SisbenService.name);
  private readonly httpClient: AxiosInstance;

  readonly name: string = 'SISBEN';
  readonly responseKey: string = 'SISBEN';
  readonly timeout: number = 30000;

  constructor(
    private readonly config: TypedConfigService,
    private readonly httpClientService: HttpClientService,
  ) {
    const sisbenConfig = this.config.getSisbenConfig();
    this.httpClient = this.httpClientService.getClient(
      new SisbenHttpClientAdapter(sisbenConfig.url),
    );
  }

  async consultarAfiliado(dto: BuscarSisben): Promise<{
    success: boolean;
    data: SisbenConsultaResult;
    metadata: { timestamp: string; httpStatus: number };
  }> {
    this.logger.log(`🔄 SISBEN: consultando ${dto.tipoDoc} - ${dto.numDoc}`);

    const initialHtml = await this.getInitialForm();
    const token = this.extractRequestVerificationToken(initialHtml);

    if (!token) {
      throw new BadRequestException('No se pudo extraer token CSRF de SISBEN');
    }

    this.logger.log('✅ Token CSRF extraído');

    // El formulario oficial usa name="documento" (no NumeroIdentificacion) y
    // enctype multipart/form-data; el sitio acepta también x-www-form-urlencoded.
    const body = new URLSearchParams();
    body.append('__RequestVerificationToken', token);
    body.append('TipoID', dto.tipoDoc);
    body.append('documento', String(dto.numDoc));

    const response = await this.httpClient.post<string>(
      '/dnp_sisbenconsulta',
      body.toString(),
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        responseType: 'text',
      },
    );

    const httpStatus = response.status;
    if (httpStatus >= 500) {
      throw new ServiceUnavailableException(
        `SISBEN respondió con estado HTTP ${httpStatus}`,
      );
    }

    const html = response.data;
    const parsed = this.parseConsultaHtml(html);

    this.logger.log(
      `✅ SISBEN parseado: encontrado=${parsed.encontrado} válido=${parsed.registroValido ?? false}`,
    );

    return {
      success: parsed.encontrado && (parsed.registroValido ?? false),
      data: parsed,
      metadata: {
        timestamp: new Date().toISOString(),
        httpStatus,
      },
    };
  }

  private async getInitialForm(): Promise<string> {
    try {
      const response = await this.httpClient.get<string>(
        '/dnp_sisbenconsulta',
        {
          responseType: 'text',
        },
      );
      this.logger.log('📄 Formulario inicial obtenido');
      return response.data;
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);
      this.logger.error(`❌ Error obteniendo formulario: ${msg}`);
      throw new BadRequestException(
        `No se pudo obtener formulario SISBEN: ${msg}`,
      );
    }
  }

  private extractRequestVerificationToken(html: string): string | null {
    const $ = cheerio.load(html);
    const value = $('input[name="__RequestVerificationToken"]').attr('value');
    const trimmed = value?.trim();
    if (trimmed) {
      this.logger.debug(`🔐 Token extraído: ${trimmed.substring(0, 20)}...`);
      return trimmed;
    }
    this.logger.warn('⚠️ Token CSRF no encontrado en HTML');
    return null;
  }

  private parseConsultaHtml(html: string): SisbenConsultaResult {
    if (this.isNoEncontrado(html)) {
      return {
        encontrado: false,
        registroValido: false,
        mensaje:
          'La persona no aparece en la base del Sisbén IV con los datos consultados.',
      };
    }

    const $ = cheerio.load(html);
    const registroValido = $('div.valido').length > 0;

    if (!registroValido) {
      return {
        encontrado: false,
        registroValido: false,
        mensaje:
          'No se pudo interpretar la respuesta de SISBEN (certificado no reconocido).',
      };
    }

    const pairs = this.collectEtiqutaCampo1Rows($);
    const personal = this.parsePersonalFields($);
    const grupo = $('.imagenpuntaje p.text-white').first().text().trim();
    const grupoDesc = $('.imagenpuntaje p[style*="font-size:16px"]')
      .first()
      .text()
      .trim();
    const oficina = this.parseOficinaContacto($);

    const result: SisbenConsultaResult = {
      encontrado: true,
      registroValido: true,
      ...personal,
    };

    for (const { label, value } of pairs) {
      const l = label.toLowerCase();
      if (l.includes('fecha de consulta')) {
        result.fechaConsulta = value;
      } else if (l.includes('ficha')) {
        result.ficha = value;
      } else if (l.includes('encuesta vigente')) {
        result.encuestaVigente = value;
      } else if (l.includes('última actualización ciudadano')) {
        result.ultimaActualizacionCiudadano = value;
      } else if (
        l.includes('última actualización') &&
        l.includes('administrativos')
      ) {
        result.ultimaActualizacionRegistrosAdministrativos = value;
      }
    }

    if (grupo) {
      result.grupoSisben = grupo;
    }
    if (grupoDesc) {
      result.grupoDescripcion = grupoDesc;
    }
    if (oficina) {
      result.oficina = oficina;
    }

    return result;
  }

  private isNoEncontrado(html: string): boolean {
    return (
      html.includes('NO</b> se encuentra en la base del Sisbén IV') ||
      html.includes('NO se encuentra en la base del Sisbén IV') ||
      /no se encuentra en la base del Sisbén IV/i.test(html)
    );
  }

  private collectEtiqutaCampo1Rows(
    $: CheerioLoaded,
  ): Array<{ label: string; value: string }> {
    const pairs: Array<{ label: string; value: string }> = [];
    $('.row.pl-2.pr-2.justify-content-between').each((_, el) => {
      const label = $(el).find('p.etiqueta').first().text().trim();
      const value = $(el).find('p.campo1').first().text().trim();
      const cleanLabel = label.replace(/\s*:\s*$/, '').trim();
      if (cleanLabel && value) {
        pairs.push({
          label: cleanLabel,
          value: value.replace(/\s+/g, ' ').trim(),
        });
      }
    });
    return pairs;
  }

  private parsePersonalFields($: CheerioLoaded): Partial<SisbenConsultaResult> {
    const out: Partial<SisbenConsultaResult> = {};
    $('div.row.campo.rounded').each((_, row) => {
      const label = $(row).find('p.etiqueta1').first().text().trim();
      const value = $(row).find('p.campo1').first().text().trim();
      const normalized = value.replace(/\s+/g, ' ').trim();
      const l = label.toLowerCase();
      if (l.includes('nombres')) {
        out.nombres = normalized;
      } else if (l.includes('apellidos')) {
        out.apellidos = normalized;
      } else if (l.includes('tipo de documento')) {
        out.tipoDocumento = normalized;
      } else if (l.includes('número de documento')) {
        out.numeroDocumento = normalized;
      } else if (l.includes('municipio')) {
        out.municipio = normalized;
      } else if (l.includes('departamento')) {
        out.departamento = normalized;
      }
    });
    return out;
  }

  private parseOficinaContacto(
    $: CheerioLoaded,
  ): SisbenOficinaContacto | undefined {
    const container = $('h2')
      .filter((_, el) => $(el).text().includes('Contacto Oficina SISBEN'))
      .first()
      .closest('.container.col-md-12.mt-2');
    if (!container.length) {
      return undefined;
    }

    const readRow = (needle: string): string | undefined => {
      const labelP = container
        .find('p.etiqueta.float-left')
        .filter((_, el) => $(el).text().includes(needle))
        .first();
      if (!labelP.length) {
        return undefined;
      }
      const row = labelP.closest('.row');
      const val = row.find('p.float-right').first().text().trim();
      return val || undefined;
    };

    const nombreAdministrador = readRow('Nombre administrador');
    const direccion = readRow('Dirección');
    const telefono = readRow('Teléfono');
    const correoElectronico = readRow('Correo Electrónico');

    if (!nombreAdministrador && !direccion && !telefono && !correoElectronico) {
      return undefined;
    }

    return {
      nombreAdministrador,
      direccion,
      telefono,
      correoElectronico,
    };
  }

  // ============================================================
  // IMPLEMENTACIÓN DE INTERFAZ PROVIDER
  // ============================================================

  async getData(
    numDoc: number,
    tipoDoc: SisbenDocumentType = SisbenDocumentType.CC,
  ): Promise<unknown> {
    try {
      const result = await this.consultarAfiliado({ tipoDoc, numDoc });
      const data = result.data;
      if (!data.encontrado) {
        const msg = data.mensaje ?? '';
        if (msg.includes('no aparece en la base del Sisbén IV')) {
          throw new UserNotFoundError(this.name, data.mensaje);
        }
        throw new BadRequestException(
          data.mensaje ?? 'No se pudo interpretar la respuesta de SISBEN',
        );
      }
      return data;
    } catch (error) {
      this.logger.error(`Error en getData: ${error}`);
      throw error;
    }
  }

  toContribution(data: unknown): ProviderContribution {
    if (!data || typeof data !== 'object') {
      return {};
    }
    const r = data as SisbenConsultaResult;
    if (!r.encontrado || !r.registroValido) {
      return {};
    }
    return {
      persona: {
        tipoIdentificacion: r.tipoDocumento,
        numeroIdentificacion: r.numeroDocumento,
        nombres: r.nombres,
        apellidos: r.apellidos,
        ubicacion: {
          departamento: r.departamento,
          municipio: r.municipio,
        },
      },
    };
  }
}
