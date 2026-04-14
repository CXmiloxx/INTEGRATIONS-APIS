import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import { AxiosInstance } from 'axios';
import { BuscarAsoPagosDTO } from './dto/buscar-aso-pagos.dto';
import {
  AsoPagosResponseDTO,
  PdfParserResponseDTO,
} from './dto/aso-pagos-response.dto';
import { TipoDocumento } from 'src/types/afiliado.types';
import { TypedConfigService } from 'src/config';
import { HttpClientService } from 'src/common/http';
import { Provider } from 'src/common/interfaces/provider.interface';
import { CitizenInfoDTO } from 'src/common/dto/citizen-info.dto';
import { AsoPagosHttpClientAdapter } from './adapters/aso-pagos-http-client.adapter';
import { FileStorageService } from 'src/common/services/file-storage.service';
import { OcrService } from 'src/common/services/ocr.service';
import { PdfParserService } from 'src/common/services/pdf-parser.service';

@Injectable()
export class AsoPagosService implements Provider {
  private readonly logger = new Logger(AsoPagosService.name);
  private readonly httpClient: AxiosInstance;

  // Propiedades requeridas por la interfaz Provider
  readonly name: string = 'asoPagos';
  readonly timeout: number = 30000;

  constructor(
    private readonly config: TypedConfigService,
    private readonly httpClientService: HttpClientService,
    private readonly fileStorageService: FileStorageService,
    private readonly ocrService: OcrService,
    private readonly pdfParserService: PdfParserService,
  ) {
    // Obtener URLs de configuración
    const urls = this.config.getUrls();
    const baseUrl = urls.asoPagosApi;
    if (!baseUrl) {
      throw new Error('URL de Aso Pagos no configurada');
    } else {
      this.logger.log(`✅ VARIABLE RESPONSE: ${baseUrl}`);
    }
    // ✅ Obtener instancia de HTTP centralizada
    this.httpClient = this.httpClientService.getClient(
      new AsoPagosHttpClientAdapter(baseUrl),
    );
  }

  /**
   * Flujo principal de consulta a ASO PAGOS
   * 1. Obtener sesión inicial (descargarCertificacionPago.jsp)
   * 2. Obtener CAPTCHA con sesión (captchapopup) - Guardar y leer OCR
   * 3. Enviar CAPTCHA al servidor (ServletEmpleado) - Obtener PDF
   */
  async consultarAportante(
    dto: BuscarAsoPagosDTO,
  ): Promise<AsoPagosResponseDTO> {
    this.logger.log(
      `🔄 Iniciando flujo de consulta Aso Pagos para ${dto.tipoDoc}: ${dto.numDoc}`,
    );

    const MAX_INTENTOS = 5;
    let intento = 0;

    while (intento < MAX_INTENTOS) {
      intento++;

      try {
        this.logger.log(`🔁 Intento #${intento}`);

        // 1. CAPTCHA
        const captchaText = await this.obtenerCaptcha();

        // 2. PDF
        const pdfResponse = await this.obtenerCertificadoPDF(dto, captchaText);

        // 3. Guardar
        const { fileName: pdfFileName } =
          await this.fileStorageService.saveImage(
            pdfResponse.pdfBuffer,
            pdfResponse.fileName,
          );

        // 4. Parsear
        const dataPdf = await this.extraerInformacionDelPDF(pdfFileName);

        // 5. limpiar
        await this.fileStorageService.deleteImage(pdfFileName);

        this.logger.log(`✅ Flujo exitoso en intento #${intento}`);

        return {
          informacionAportante: dataPdf,
        };
      } catch (error: unknown) {
        const errorMessage =
          error instanceof Error ? error.message : 'Unknown error';

        this.logger.warn(`⚠️ Intento #${intento} fallido: ${errorMessage}`);

        //Detectar errores no recuperables
        // 1. Persona no existe en la base de datos
        const personaNoExiste =
          errorMessage.includes('no existe') ||
          errorMessage.includes('no se encuentra presente') ||
          errorMessage.includes('empleado seleccionado no existe') ||
          errorMessage.includes('planilla paga');

        if (personaNoExiste) {
          this.logger.error(
            `❌ Persona no existe en ASO-PAGOS. No reintentar.`,
          );
          throw new BadRequestException(
            'El empleado seleccionado no existe o no se encuentra presente en una planilla paga. No hay certificados disponibles.',
          );
        }

        // 2. Error genérico de página de error
        const esErrorPaginaGenerico =
          errorMessage.includes('página de error') ||
          errorMessage.includes('retornó una página') ||
          errorMessage.includes('no se encuentra presente en una planilla');

        if (esErrorPaginaGenerico) {
          this.logger.error(
            `❌ Error de página. Probablemente la persona no existe.`,
          );
          throw new BadRequestException(
            'El empleado seleccionado no existe o no se encuentra presente en una planilla paga. No hay certificados disponibles.',
          );
        }

        // 3. Solo reintentar si es error recuperable (CAPTCHA / PDF inválido)
        const esErrorCaptcha =
          errorMessage.includes('PDF válido') ||
          errorMessage.includes('CAPTCHA');

        if (!esErrorCaptcha && !esErrorPaginaGenerico) {
          // error real no recuperable → no reintentar
          throw error;
        }

        if (intento >= MAX_INTENTOS) {
          this.logger.error(`❌ Máximo de intentos alcanzado`);
          throw new BadRequestException(
            'No se pudo completar la consulta después de varios intentos',
          );
        }
      }
    }

    throw new BadRequestException('Error inesperado en flujo');
  }

  /**
   * Paso 1: Obtener CAPTCHA, guardarlo y extraer texto
   * ⚡ OPTIMIZACIÓN: OCR directamente del buffer (sin guardar archivo innecesario)
   */
  private async obtenerCaptcha(): Promise<string> {
    this.logger.log('📍 Paso 1: Obteniendo CAPTCHA...');

    try {
      const response = await this.httpClient.get(
        '/interssi/captchapopup?recaptchapop=true',
        {
          responseType: 'arraybuffer',
        },
      );

      if (response.status !== 200) {
        throw new BadRequestException(
          `Error al obtener CAPTCHA: Status ${response.status}`,
        );
      }

      const imageBuffer = Buffer.from(response.data as ArrayBuffer);

      this.logger.log(
        `📦 CAPTCHA recibido (${imageBuffer.length} bytes). Procesando OCR directo...`,
      );

      // ⚡ OPTIMIZACIÓN: OCR directamente del buffer sin guardar
      const captchaText =
        await this.ocrService.extraerTextoDelBuffer(imageBuffer);

      this.logger.log(`📝 Texto del CAPTCHA: "${captchaText}"`);

      return captchaText;
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';

      this.logger.warn(`⚠️ Error CAPTCHA: ${errorMessage}`);

      throw error;
    }
  }

  /**
   * Paso 3: Enviar CAPTCHA y obtener PDF del certificado
   */
  private async obtenerCertificadoPDF(
    dto: BuscarAsoPagosDTO,
    captchaText: string,
  ): Promise<{ pdfBuffer: Buffer; fileName: string }> {
    this.logger.log('📍 Paso 3: Obteniendo certificado PDF...');

    try {
      // Construir FormData
      const formData = new URLSearchParams();

      // Parámetros requeridos por ServletEmpleado (en orden exacto)
      formData.append('tarea', 'verCertificadoTresNuevo');
      formData.append('tipoID', dto.tipoDoc);
      formData.append('numeroID', String(dto.numDoc));
      formData.append('ano', new Date().getFullYear().toString());
      formData.append('mes', '01'); // Siempre enero (01) como en el ejemplo
      formData.append('tipoReporte', 'sinValores');
      formData.append('tipoID1', dto.tipoDoc);
      formData.append('numeroID1', '');
      formData.append('ano1', '');
      formData.append('captchaIn', captchaText); // ✨ CAPTCHA leído por OCR
      formData.append('externo', 'true');
      formData.append('tipos_numeros_planillas_pagas', 'E--36193111');
      formData.append('clicks', '1');
      formData.append('empleado', `${dto.tipoDoc}--${dto.numDoc}`);
      formData.append('tipoB', '0');
      formData.append('validaCaptcha', 'validaCaptcha');

      this.logger.log(
        `📤 Enviando POST a /interssi/ServletEmpleado con CAPTCHA: "${captchaText}"`,
      );

      this.logger.debug(`📋 FormData enviado: ${formData.toString()}`);

      const response = await this.httpClient.post(
        '/interssi/ServletEmpleado',
        formData.toString(),
        {
          responseType: 'arraybuffer',
        },
      );

      if (response.status !== 200) {
        throw new BadRequestException(
          `Error al obtener certificado: Status ${response.status}`,
        );
      }

      const pdfBuffer = Buffer.from(response.data as ArrayBuffer);

      // ✨ VALIDACIÓN CRÍTICA: Verificar que sea realmente un PDF
      if (!this.isPdfValid(pdfBuffer)) {
        this.logger.error(
          `❌ La respuesta NO es un PDF válido. Primeros 100 bytes: ${pdfBuffer.toString('utf-8', 0, 5000)}`,
        );

        throw new BadRequestException(
          'La respuesta del servidor no contiene un PDF válido. Verifique el CAPTCHA.',
        );
      }

      // Extraer nombre del archivo del header Content-Disposition
      const contentDisposition =
        (response.headers['content-disposition'] as string) || '';
      let fileName = 'certificado.pdf';

      const fileNameMatch = contentDisposition.match(/filename=([^;]+)/);
      if (fileNameMatch?.[1]) {
        fileName = fileNameMatch[1].replace(/"/g, '').trim();
      }

      this.logger.log(
        `✅ PDF descargado exitosamente: ${fileName} (${pdfBuffer.length} bytes)`,
      );
      this.logger.debug(`📊 Content-Type: ${response.headers['content-type']}`);
      this.logger.debug(
        `📊 Content-Length: ${response.headers['content-length']}`,
      );

      return {
        pdfBuffer,
        fileName,
      };
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`❌ Error al obtener PDF: ${errorMessage}`);

      throw new BadRequestException(
        `Error al descargar certificado de Aso Pagos: ${errorMessage}`,
      );
    }
  }

  private async extraerInformacionDelPDF(
    pdfFileName: string,
  ): Promise<PdfParserResponseDTO> {
    this.logger.log('📍 Paso 5: Extrayendo información del PDF...');
    const pdfBuffer = await this.fileStorageService.getFile(pdfFileName);

    if (!this.isPdfValid(pdfBuffer)) {
      throw new BadRequestException('El archivo no es un PDF válido');
    }

    try {
      const textContent =
        await this.pdfParserService.extraerTextoPDF(pdfBuffer);
      if (textContent.length === 0) {
        throw new BadRequestException('No se pudo extraer el texto del PDF');
      }
      const parser = this.pdfParserService.parsearCertificado(textContent);

      return parser;
    } catch (err: unknown) {
      this.logger.error(
        `❌ Error extrayendo información del PDF: ${err instanceof Error ? err.message : 'Unknown error'}`,
      );
      throw err;
    }
  }
  /**
   * Valida que un buffer sea realmente un PDF
   * Los PDFs comienzan con los magic bytes: %PDF
   * También detecta errores HTML de "persona no existe"
   */
  private isPdfValid(buffer: Buffer): boolean {
    if (buffer.length < 4) {
      this.logger.warn(
        `⚠️ Buffer muy pequeño para ser PDF: ${buffer.length} bytes`,
      );
      return false;
    }

    // Magic bytes de PDF: %PDF-
    const pdfMagic = buffer.toString('utf-8', 0, 4);

    if (pdfMagic !== '%PDF') {
      this.logger.warn(
        `⚠️ Magic bytes inválidos: "${pdfMagic}" (esperado "%PDF")`,
      );

      // Verificar si es HTML (error)
      const htmlContent = buffer.toString('utf-8', 0, 5000);
      if (htmlContent.includes('<!DOCTYPE') || htmlContent.includes('<html')) {
        this.logger.error('❌ La respuesta contiene HTML en lugar de PDF');

        // 🔍 Buscar texto de error dentro de <p> tags (donde suele estar el mensaje)
        const pMatch = htmlContent.match(/<p[^>]*>(.*?)<\/p>/is);
        const errorText = pMatch ? pMatch[1] : '';

        this.logger.debug(
          `📄 Texto de error encontrado: ${errorText.substring(0, 200)}`,
        );

        // Detectar si es error de "persona no existe"
        const textoLower = (errorText + htmlContent).toLowerCase();
        if (
          textoLower.includes('no existe') ||
          textoLower.includes('no se encuentra') ||
          textoLower.includes('empleado seleccionado') ||
          textoLower.includes('planilla paga')
        ) {
          this.logger.error(
            '❌ PERSONA NO EXISTE: El empleado no se encuentra en las planillas pagas',
          );
          throw new BadRequestException(
            'El empleado seleccionado no existe o no se encuentra presente en una planilla paga',
          );
        }

        // Otros errores HTML - registrar contenido completo para análisis
        this.logger.warn(`⚠️ Error HTML genérico recibido`);
        this.logger.debug(
          `📄 HTML completo (primeros 1500 chars): ${htmlContent.substring(0, 1500)}`,
        );

        throw new BadRequestException(
          'El servidor retornó una página de error. Intente nuevamente.',
        );
      }

      return false;
    }

    this.logger.log('✅ Buffer validado como PDF');
    return true;
  }

  // ============================================================
  // IMPLEMENTACIÓN DE INTERFAZ PROVIDER
  // ============================================================

  async getData(
    numDoc: number,
    tipoDoc: TipoDocumento = TipoDocumento.CC,
  ): Promise<AsoPagosResponseDTO> {
    try {
      const result = await this.consultarAportante({ tipoDoc, numDoc });
      return result;
    } catch (error) {
      this.logger.error(`Error en getData: ${error}`);
      throw error;
    }
  }

  normalize(data: AsoPagosResponseDTO): Partial<CitizenInfoDTO> {
    try {
      if (!data || !data.informacionAportante) {
        this.logger.error(
          `Datos inválidos para normalizar: ${JSON.stringify(data)}`,
        );
        throw new BadRequestException('Datos inválidos para normalizar');
      }

      return {
        asoPagos: {
          informacionAportante: data.informacionAportante,
        },
      };
    } catch (error) {
      this.logger.error(`Error en normalize: ${error}`);
      throw error;
    }
  }
}
