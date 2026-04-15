import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import { AxiosInstance } from 'axios';
import qs from 'qs';
import { BuscarAfiliado } from './dto/buscar-afiliado.dto';
import {
  DatosAfiliacion,
  InformacionBasica,
  ResultadoConsultaAfiliado,
  TipoDocumento,
} from 'src/types/afiliado.types';
import * as cheerio from 'cheerio';
import { AxiosError } from 'axios';
import { TypedConfigService } from 'src/config';
import { HttpClientService } from 'src/common/http';
import { Provider } from 'src/common/interfaces/provider.interface';
import { AdresHttpClientAdapter } from './adapters/adres-http-client.adapter';
import { UserNotFoundError } from 'src/common/errors';
import { ProviderContribution } from 'src/common/dto/citizen-response.dto';

@Injectable()
export class AdresService implements Provider {
  private readonly logger = new Logger(AdresService.name);
  private readonly urls: { adresApi: string; urlApi: string };
  private readonly radScriptManager: string;
  private readonly eventTarget: string;
  private readonly viewState: string;
  private readonly viewStateGenerator: string;
  private readonly eventValidation: string;
  private readonly httpClient: AxiosInstance;

  // Propiedades requeridas por la interfaz Provider
  readonly name: string = 'ADRES';
  readonly responseKey: string = 'ADRES';
  readonly timeout: number = 30000;

  constructor(
    private readonly config: TypedConfigService,
    private readonly httpClientService: HttpClientService,
  ) {
    this.urls = this.config.getUrls();
    this.radScriptManager = this.config.getSecurityConfig().radScriptManager;
    this.eventTarget = this.config.getSecurityConfig().eventTarget;
    this.viewState = this.config.getSecurityConfig().viewState;
    this.viewStateGenerator =
      this.config.getSecurityConfig().viewStateGenerator;
    this.eventValidation = this.config.getSecurityConfig().eventValidation;

    // ✅ Obtener instancia de HTTP centralizada
    this.httpClient = this.httpClientService.getClient(
      new AdresHttpClientAdapter(this.urls.adresApi),
    );
  }

  async consultarAfiliado(dto: BuscarAfiliado) {
    const formData = {
      RadScriptManager1_TSM: this.radScriptManager,
      __EVENTTARGET: this.eventTarget,
      __VIEWSTATE: this.viewState,
      __VIEWSTATEGENERATOR: this.viewStateGenerator,
      __EVENTVALIDATION: this.eventValidation,
      tipoDoc: dto.tipoDoc,
      txtNumDoc: dto.numDoc,
    };

    this.logger.log(`Enviando consulta para ${dto.tipoDoc}: ${dto.numDoc}`);

    //Consulta inicial para obtener el token
    const postResponse = await this.httpClient.post(
      `/ConsultarAfiliadoWeb_2.aspx`,
      qs.stringify(formData),
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      },
    );

    const htmlResponse = postResponse.data as string;

    const token = this.extractToken(htmlResponse);

    if (!token) {
      this.logger.error(
        `No se pudo extraer el tokenId. Respuesta: ${htmlResponse.substring(0, 100)}`,
      );
      throw new BadRequestException(
        'No se pudo extraer el tokenId de la respuesta del servicio ADRES.',
      );
    }

    this.logger.log('✅ TokenId extraído');

    // ✅ CORRECCIÓN 2: Extraer URL completa desde window.open si existe
    const consultaUrl = this.buildConsultaUrl(htmlResponse, token);
    this.logger.log('🔗 URL de consulta del afiliado');

    // Extraer cookies de sesión
    const cookies = this.httpClientService.extractCookiesFromHeaders(
      postResponse.headers as Record<string, unknown>,
    );
    this.httpClientService.setCookies('adres', cookies);
    this.logger.log('🍪 Cookies de sesión extraidas');

    // Consulta del afiliado con cookies
    const result = await this.buscarAfiliado(consultaUrl, cookies);

    const datosUser = this.parsearDatosUser(result.html);

    return {
      success: true,
      data: datosUser,
      metadata: {
        consultaUrl,
        fechaProcesamiento: new Date().toISOString(),
      },
    };
  }

  // Extraer token de la respuesta del servicio ADRES
  private extractToken(htmlResponse: string): string | null {
    // Intentar 1: Capturar URL completa dentro de window.open
    const urlRegex = /window\.open\(['"`]([^'"`]+\.aspx\?tokenId=[^'"`]+)['"`]/;
    const urlMatch = htmlResponse.match(urlRegex);

    if (urlMatch?.[1]) {
      const fullUrl = urlMatch[1];
      this.logger.log('🔗 URL  ENCONTRADA DE LA PRIMERA FORMA');

      // Extraer token de la URL completa
      const tokenRegex = /tokenId=([^&]+)/;
      const tokenMatch = fullUrl.match(tokenRegex);
      if (tokenMatch?.[1]) {
        this.logger.log('TOKEN EXTRAIDO CORRECTAMENTE DE LA PRIMERA FORMA');
        return tokenMatch[1];
      }
    }

    // Intentar 2: Buscar solo el token (fallback)
    const tokenRegex = /tokenId=([^&'"\\>\s]+)/;
    const tokenMatch = htmlResponse.match(tokenRegex);

    if (tokenMatch?.[1]) {
      this.logger.log(
        'TOKEN EXTRAIDO CORRECTAMENTE DE LA SEGUNDA FORMA DE LA VALIDACION',
      );
      return tokenMatch[1];
    }

    return null;
  }

  //Construir URL de consulta del afiliado
  private buildConsultaUrl(htmlResponse: string, tokenId: string): string {
    // Extraer la ruta exacta desde window.open
    const pathRegex =
      /window\.open\(['"`]([^'"`]+\.aspx\?tokenId=)[^'"`]+['"`]/;
    const pathMatch = htmlResponse.match(pathRegex);

    if (pathMatch?.[1]) {
      const relativePath = pathMatch[1];
      // Si es relativa, agregar base URL
      if (!relativePath.startsWith('http')) {
        const baseUrl = this.urls.adresApi;
        // Remover posible slash final del base y construir la URL completa
        return `${baseUrl}/${relativePath}${encodeURIComponent(tokenId)}`;
      }
      return relativePath + encodeURIComponent(tokenId);
    }

    // Fallback: construir la URL de consulta del afiliado
    const baseUrl = this.urls.adresApi;
    return `${baseUrl}/RespuestaConsulta.aspx?tokenId=${encodeURIComponent(tokenId)}`;
  }

  // Consulta del afiliado con cookies
  private async buscarAfiliado(consultaUrl: string, cookies?: string) {
    this.logger.log('📡 Consultando afiliado en la URL');

    try {
      const headers: Record<string, string> = {
        Referer: 'https://www.adres.gov.co/consulte-su-eps',
        Accept:
          'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'es-CO,es;q=0.9,en;q=0.8',
      };

      if (cookies) {
        headers['Cookie'] = cookies;
      }

      const response = await this.httpClient.get(consultaUrl, { headers });
      const htmlResponse = response.data as string;

      this.logger.log('✅ Respuesta recibida');

      // Verificar si es página de error
      if (
        htmlResponse.includes('Error en runtime') ||
        htmlResponse.includes('Error de servidor')
      ) {
        this.logger.warn(
          '⚠️ La respuesta contiene una página de error del servidor, se debe revisar la respuesta',
        );
      }

      return { html: htmlResponse };
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`❌ Error al consultar afiliado: ${errorMessage}`);

      if (error instanceof AxiosError) {
        this.logger.error(`Status: ${error.response?.status}`);
        this.logger.error(
          `Response preview: ${error.response?.data instanceof String ? error.response?.data.substring(0, 800) : 'Unknown response data'}`,
        );
      }

      throw new BadRequestException(
        `Error al consultar la información del afiliado: ${errorMessage}`,
      );
    }
  }

  private parsearDatosUser(html: string): ResultadoConsultaAfiliado {
    this.logger.log(
      '🔍 Parseando HTML de respuesta para extraer datos del afiliado',
    );

    const $ = cheerio.load(html);
    const result: ResultadoConsultaAfiliado = {
      informacionBasica: {} as InformacionBasica,
      datosAfiliacion: [],
    };

    //Validar error en la busqueda del afiliado
    try {
      // 📋 1. Extraer Información Básica
      const basicTable = $('#GridViewBasica');

      if (basicTable.length === 0) {
        let errorMessage = 'No se encontro la informacion del afiliado';
        const responseHtml = $('#lblError');
        if (responseHtml.length > 0) {
          errorMessage += ' - ' + responseHtml.text().trim();
        }
        throw new UserNotFoundError(this.name, errorMessage);
      }

      if (basicTable.length > 0) {
        const basicData: Partial<InformacionBasica> = {};

        basicTable.find('tr').each((_, row) => {
          const cells = $(row).find('td');
          if (cells.length === 2) {
            const key = $(cells[0]).text().trim().toUpperCase();
            const value = $(cells[1]).text().trim();
            // Mapeo de claves del HTML a propiedades del DTO
            switch (key) {
              case 'TIPO DE IDENTIFICACIÓN':
              case 'TIPO DE IDENTIFICACION':
                basicData.tipoIdentificacion = value;
                break;
              case 'NÚMERO DE IDENTIFICACION':
              case 'NUMERO DE IDENTIFICACION':
                basicData.numeroIdentificacion = value;
                break;
              case 'NOMBRES':
                basicData.nombres = value;
                break;
              case 'APELLIDOS':
                basicData.apellidos = value;
                break;
              case 'FECHA DE NACIMIENTO':
                basicData.fechaNacimiento = value;
                break;
              case 'DEPARTAMENTO':
                basicData.departamento = value;
                break;
              case 'MUNICIPIO':
                basicData.municipio = value;
                break;
            }
          }
        });

        result.informacionBasica = basicData as InformacionBasica;
        this.logger.log(
          `✅ Información básica extraída: ${basicData.nombres} ${basicData.apellidos}`,
        );
      }

      // 📋 2. Extraer Datos de Afiliación (GridViewAfiliacion)
      const affiliationTable = $('#GridViewAfiliacion');
      if (affiliationTable.length > 0) {
        // Extraer headers para mapeo dinámico
        const headers: string[] = [];
        const headerRow = affiliationTable.find('tr.DataGrid_Header');
        headerRow.find('th').each((_, th) => {
          headers.push($(th).text().trim().toUpperCase());
        });

        // Extraer filas de datos
        affiliationTable.find('tr').each((_, row) => {
          // Saltar header
          if ($(row).hasClass('DataGrid_Header')) return;

          const cells = $(row).find('td');
          if (cells.length === headers.length && cells.length > 0) {
            const affiliation: Partial<DatosAfiliacion> = {};

            cells.each((index, cell) => {
              const header = headers[index];
              const value = $(cell).text().trim();

              switch (header) {
                case 'ESTADO':
                  affiliation.estado = value;
                  break;
                case 'ENTIDAD':
                  affiliation.entidad = value;
                  break;
                case 'REGIMEN':
                  affiliation.regimen = value;
                  break;
                case 'FECHA DE AFILIACIÓN EFECTIVA':
                case 'FECHA DE AFILIACION EFECTIVA':
                  affiliation.fechaAfiliacionEfectiva = value;
                  break;
                case 'FECHA DE FINALIZACIÓN DE AFILIACIÓN':
                case 'FECHA DE FINALIZACION DE AFILIACION':
                  affiliation.fechaFinalizacionAfiliacion = value;
                  break;
                case 'TIPO DE AFILIADO':
                  affiliation.tipoAfiliado = value;
                  break;
              }
            });

            // Solo agregar si tiene datos válidos
            if (affiliation.estado || affiliation.entidad) {
              result.datosAfiliacion.push(affiliation as DatosAfiliacion);
            }
          }
        });

        this.logger.log(
          `✅ ${result.datosAfiliacion.length} registro(s) de afiliación extraídos`,
        );
      }

      // 📋 3. Extraer Metadata (opcional pero útil para auditoría)
      const fechaImpresion = $('#lblProceso').text().trim();
      const estacionOrigen = $('#lblEstacion').text().trim();

      if (fechaImpresion || estacionOrigen) {
        result.metadata = {
          fechaImpresion,
          estacionOrigen,
        };
      }

      // 🎯 Validación mínima de datos requeridos
      if (!result.informacionBasica.numeroIdentificacion) {
        this.logger.warn(
          '⚠️ No se pudo extraer el número de identificación del afiliado',
        );
      }

      return result;
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`❌ Error al parsear HTML: ${errorMessage}`);
      if (error instanceof UserNotFoundError) {
        throw error;
      }
      throw new BadRequestException(
        `Error al procesar la respuesta del servicio ADRES: ${errorMessage}`,
      );
    }
  }

  // ============================================================
  // IMPLEMENTACIÓN DE INTERFAZ PROVIDER
  // ============================================================

  async getData(numDoc: number, tipoDoc: TipoDocumento = TipoDocumento.CC) {
    try {
      const result = await this.consultarAfiliado({ tipoDoc, numDoc });
      return result.data;
    } catch (error) {
      this.logger.error(`Error en getData: ${error}`);
      throw error;
    }
  }

  toContribution(data: unknown): ProviderContribution {
    const resultado = data as ResultadoConsultaAfiliado | null;
    if (!resultado) return {};

    const basica = resultado.informacionBasica;
    const persona = basica
      ? {
          tipoIdentificacion: basica.tipoIdentificacion,
          numeroIdentificacion: basica.numeroIdentificacion,
          nombres: basica.nombres,
          apellidos: basica.apellidos,
          fechaNacimiento: basica.fechaNacimiento ?? null,
          ubicacion: {
            departamento: basica.departamento,
            municipio: basica.municipio,
          },
        }
      : undefined;

    const afiliaciones = (resultado.datosAfiliacion ?? []).map((a) => ({
      fuente: this.responseKey,
      estado: a.estado,
      entidad: a.entidad,
      regimen: a.regimen,
      fechaInicio: a.fechaAfiliacionEfectiva || null,
      fechaFin: a.fechaFinalizacionAfiliacion || null,
      tipo: a.tipoAfiliado,
    }));

    return { persona, afiliaciones };
  }
}
