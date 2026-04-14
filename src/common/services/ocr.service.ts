import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import Tesseract from 'tesseract.js';

@Injectable()
export class OcrService implements OnModuleInit {
  private readonly logger = new Logger(OcrService.name);
  private worker: Tesseract.Worker | null = null;
  private isWorkerReady = false;

  /**
   * Inicializa el worker de Tesseract al cargar el módulo
   * Esto evita la latencia de carga en cada request
   */
  async onModuleInit(): Promise<void> {
    try {
      this.logger.log('⏳ Inicializando OCR Worker (Tesseract.js)...');
      this.worker = await Tesseract.createWorker();
      // Workers now come pre-loaded, no need to call load()
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
      await (this.worker as any).loadLanguage?.('eng+spa');
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
      await (this.worker as any).initialize?.('eng+spa');
      this.isWorkerReady = true;
      this.logger.log('✅ OCR Worker inicializado y listo');
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      this.logger.warn(
        `⚠️ No se pudo pre-cargar OCR Worker: ${errorMessage}. Se usará OCR bajo demanda.`,
      );
      this.worker = null;
      this.isWorkerReady = false;
    }
  }

  /**
   * Extrae texto de una imagen usando Tesseract.js (ruta del archivo)
   */
  async extraerTexto(imagePath: string): Promise<string> {
    this.logger.log(`🔍 Iniciando OCR en: ${imagePath}`);

    try {
      // Usar worker si está disponible, sino fallback a recognize
      if (this.isWorkerReady && this.worker) {
        return await this.extraerTextoConWorker(imagePath);
      } else {
        return await this.extraerTextoSinWorker(imagePath);
      }
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`❌ Error en OCR: ${errorMessage}`);
      throw error;
    }
  }

  /**
   * Extrae texto de un buffer de imagen (ya optimizado con worker)
   */
  async extraerTextoDelBuffer(imageBuffer: Buffer): Promise<string> {
    this.logger.log(`🔍 Iniciando OCR en buffer (${imageBuffer.length} bytes)`);

    try {
      // Usar worker si está disponible, sino fallback a recognize
      if (this.isWorkerReady && this.worker) {
        return await this.extraerTextoConWorkerBuffer(imageBuffer);
      } else {
        return await this.extraerTextoSinWorkerBuffer(imageBuffer);
      }
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`❌ Error en OCR con buffer: ${errorMessage}`);
      throw error;
    }
  }

  /**
   * Extrae texto usando el worker persistente (más rápido)
   */
  private async extraerTextoConWorker(imagePath: string): Promise<string> {
    const result = await this.worker!.recognize(imagePath);

    const extractedText = result.data.text.trim();

    this.logger.log(
      `✅ Texto extraído (worker): "${extractedText}" (confianza: ${Math.round(result.data.confidence)}%)`,
    );

    // Limpiar texto del CAPTCHA (solo caracteres alfanuméricos)
    const cleanText = extractedText
      .replace(/[^a-zA-Z0-9]/g, '')
      .substring(0, 10); // Limitar a 10 caracteres

    this.logger.log(`🧹 Texto limpiado: "${cleanText}"`);

    return cleanText;
  }

  /**
   * Extrae texto usando el worker persistente desde buffer (más rápido)
   */
  private async extraerTextoConWorkerBuffer(
    imageBuffer: Buffer,
  ): Promise<string> {
    const result = await this.worker!.recognize(imageBuffer);

    const extractedText = result.data.text.trim();

    this.logger.log(
      `✅ Texto extraído (worker + buffer): "${extractedText}" (confianza: ${Math.round(result.data.confidence)}%)`,
    );

    // Limpiar texto del CAPTCHA (solo caracteres alfanuméricos)
    const cleanText = extractedText
      .replace(/[^a-zA-Z0-9]/g, '')
      .substring(0, 10); // Limitar a 10 caracteres

    this.logger.log(`🧹 Texto limpiado: "${cleanText}"`);

    return cleanText;
  }

  /**
   * Fallback: Extrae texto sin worker persistente (más lento)
   */
  private async extraerTextoSinWorker(imagePath: string): Promise<string> {
    this.logger.warn('⚠️ Usando Tesseract sin worker persistente (más lento)');

    const result = await Tesseract.recognize(imagePath, 'eng+spa', {
      logger: (m) => {
        if (m.status === 'recognizing text') {
          this.logger.debug(`OCR Progress: ${Math.round(m.progress * 100)}%`);
        }
      },
    });

    const extractedText = result.data.text.trim();

    this.logger.log(
      `✅ Texto extraído: "${extractedText}" (confianza: ${Math.round(result.data.confidence)}%)`,
    );

    // Limpiar texto del CAPTCHA (solo caracteres alfanuméricos)
    const cleanText = extractedText
      .replace(/[^a-zA-Z0-9]/g, '')
      .substring(0, 10); // Limitar a 10 caracteres

    this.logger.log(`🧹 Texto limpiado: "${cleanText}"`);

    return cleanText;
  }

  /**
   * Fallback: Extrae texto sin worker persistente desde buffer (más lento)
   */
  private async extraerTextoSinWorkerBuffer(
    imageBuffer: Buffer,
  ): Promise<string> {
    this.logger.warn(
      '⚠️ Usando Tesseract sin worker persistente desde buffer (más lento)',
    );

    const result = await Tesseract.recognize(imageBuffer, 'eng+spa', {
      logger: (m) => {
        if (m.status === 'recognizing text') {
          this.logger.debug(`OCR Progress: ${Math.round(m.progress * 100)}%`);
        }
      },
    });

    const extractedText = result.data.text.trim();

    this.logger.log(
      `✅ Texto extraído: "${extractedText}" (confianza: ${Math.round(result.data.confidence)}%)`,
    );

    // Limpiar texto del CAPTCHA (solo caracteres alfanuméricos)
    const cleanText = extractedText
      .replace(/[^a-zA-Z0-9]/g, '')
      .substring(0, 10); // Limitar a 10 caracteres

    this.logger.log(`🧹 Texto limpiado: "${cleanText}"`);

    return cleanText;
  }

  /**
   * Limpia los recursos del worker al destruir el servicio
   */
  async onModuleDestroy(): Promise<void> {
    if (this.worker) {
      try {
        this.logger.log('🧹 Terminando OCR Worker...');
        await this.worker.terminate();
        this.worker = null;
        this.isWorkerReady = false;
        this.logger.log('✅ OCR Worker terminado');
      } catch (error: unknown) {
        const errorMessage =
          error instanceof Error ? error.message : 'Unknown error';
        this.logger.error(`❌ Error terminando OCR Worker: ${errorMessage}`);
      }
    }
  }
}
