import { Injectable, BadRequestException } from '@nestjs/common';
import { TipoDocumento } from 'src/types/afiliado.types';
import { SisbenDocumentType } from 'src/types/sisben.types';

/**
 * Mapea tipos de documento normalizados (ej: "CC")
 * a formatos específicos de cada servicio
 */
@Injectable()
export class DocumentTypeMapper {
  /**
   * Convierte tipo normalizado a TipoDocumento (ADRES/AsoPagos)
   * Entrada: "CC", "TI", "CE", etc.
   */
  toAdresFormat(normalizedType: string): TipoDocumento {
    const typeMap: Record<string, TipoDocumento> = {
      CC: TipoDocumento.CC,
      TI: TipoDocumento.TI,
      RC: TipoDocumento.RC,
      CE: TipoDocumento.CE,
      PA: TipoDocumento.PA,
      NU: TipoDocumento.NU,
      AS: TipoDocumento.AS,
      MS: TipoDocumento.MS,
      CD: TipoDocumento.CD,
      CN: TipoDocumento.CN,
      SC: TipoDocumento.SC,
      PE: TipoDocumento.PE,
      PT: TipoDocumento.PT,
    };

    const mapped = typeMap[normalizedType];
    if (!mapped) {
      throw new BadRequestException(
        `Unknown document type for ADRES: ${normalizedType}`,
      );
    }
    return mapped;
  }

  /**
   * Convierte tipo normalizado a SisbenDocumentType
   * Entrada: "CC" → "3", "RC" → "1", etc.
   */
  toSisbenFormat(normalizedType: string): SisbenDocumentType {
    const typeMap: Record<string, SisbenDocumentType> = {
      RC: SisbenDocumentType.RC,
      TI: SisbenDocumentType.TI,
      CC: SisbenDocumentType.CC,
      CE: SisbenDocumentType.CE,
      DNI: SisbenDocumentType.DNI_ORIGEN,
      PA: SisbenDocumentType.DNI_PASAPORTE,
      SC: SisbenDocumentType.SC,
      PE: SisbenDocumentType.PEP,
      PT: SisbenDocumentType.PPT,
    };

    const mapped = typeMap[normalizedType];
    if (!mapped) {
      throw new BadRequestException(
        `Unknown document type for SISBEN: ${normalizedType}`,
      );
    }
    return mapped;
  }

  /**
   * Convierte tipo normalizado a formato específico del servicio
   */
  toServiceFormat(
    normalizedType: string,
    serviceName: string,
  ): TipoDocumento | SisbenDocumentType {
    switch (serviceName.toLowerCase()) {
      case 'adres':
      case 'asopagos':
        return this.toAdresFormat(normalizedType);
      case 'sisben':
        return this.toSisbenFormat(normalizedType);
      default:
        throw new BadRequestException(`Unknown service: ${serviceName}`);
    }
  }
}
