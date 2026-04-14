import { Injectable, Logger } from '@nestjs/common';
import { PDFParse } from 'pdf-parse';
import { PdfParserResponseDTO } from 'src/core/providers/aso-pagos/dto/aso-pagos-response.dto';

@Injectable()
export class PdfParserService {
  private readonly logger = new Logger(PdfParserService.name);

  async extraerTextoPDF(pdfBuffer: Buffer): Promise<string> {
    try {
      this.logger.log('📄 Extrayendo texto del PDF...');

      const parser = new PDFParse({
        data: pdfBuffer,
      });

      const data = await parser.getText();

      const textContent = data.text || '';

      this.logger.log(`✅ Texto extraído: ${textContent.length} caracteres`);

      return textContent;
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`❌ Error extrayendo texto: ${errorMessage}`);
      throw error;
    }
  }

  parsearCertificado(text: string): PdfParserResponseDTO {
    const clean = text.replace(/\s+/g, ' ');

    const result: PdfParserResponseDTO = {};

    //NIT empresa
    const nitMatch = clean.match(/NI[-\s]?(\d{8,})/i);
    if (nitMatch) {
      result.nit = nitMatch[1];
    }

    //Empresa
    const empresaMatch =
      clean.match(/empresa\s+([A-Z\s]+)\s+con documento/i) ||
      clean.match(/Raz[oó]n Social\s+([A-Z\s]+)/i);

    if (empresaMatch) {
      result.empresa = empresaMatch[1].trim();
    }

    //Nombre completo
    const nombreMatch = clean.match(/cotizante\s+([A-Z\s]+)\s+identificado/i);

    if (nombreMatch) {
      const fullName = nombreMatch[1].trim();
      const parts = fullName.split(' ');

      result.nombres = parts.slice(0, 2).join(' ');
      result.apellidos = parts.slice(2).join(' ');
    }

    // Cedula
    const cedulaMatch = clean.match(/CC[-\s]?(\d{6,})/i);
    if (cedulaMatch) {
      result.cedula = cedulaMatch[1];
    }

    // Periodo pensión
    const pensionMatch = clean.match(/Per[ií]odo Pensi[oó]n:\s*(\d{4}-\d{2})/i);
    if (pensionMatch) {
      result.periodoPension = pensionMatch[1];
    }

    //Periodo salud
    const saludMatch = clean.match(/Per[ií]odo Salud\s*:\s*(\d{4}-\d{2})/i);
    if (saludMatch) {
      result.periodoSalud = saludMatch[1];
    }

    return result;
  }
}
