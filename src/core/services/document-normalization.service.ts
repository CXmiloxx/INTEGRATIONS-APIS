import { Injectable, Logger } from '@nestjs/common';
import {
  NormalizedDocumentType,
  ADRES_DOCUMENT_TYPES,
  SISBEN_DOCUMENT_TYPES,
  DocumentTypeMap,
} from 'src/common/types/document-type';

@Injectable()
export class DocumentNormalizationService {
  private readonly logger = new Logger(DocumentNormalizationService.name);

  private readonly providerMaps: Record<string, DocumentTypeMap[]> = {
    asoPagos: ADRES_DOCUMENT_TYPES, // Aso Pagos usa mismo formato que ADRES
    adres: ADRES_DOCUMENT_TYPES,
    sisben: SISBEN_DOCUMENT_TYPES,
  };

  /**
   * Obtiene valor externo que espera un proveedor dado tipo normalizado
   */
  getExternalValue(
    normalizedType: NormalizedDocumentType,
    provider: string,
  ): string | number {
    const map = this.providerMaps[provider];
    if (!map) {
      throw new Error(`No document type mapping for provider: ${provider}`);
    }

    const found = map.find((m) => m.normalizedType === normalizedType);
    if (!found) {
      throw new Error(
        `Cannot map normalized type "${normalizedType}" to provider ${provider}`,
      );
    }

    return found.externalValue;
  }

  /**
   * Obtiene tipo normalizado desde valor externo de un proveedor
   */
  getNormalizedType(
    externalValue: string | number,
    provider: string,
  ): NormalizedDocumentType {
    const map = this.providerMaps[provider];
    if (!map) {
      throw new Error(`No document type mapping for provider: ${provider}`);
    }

    const found = map.find((m) => m.externalValue === externalValue);
    if (!found) {
      throw new Error(
        `Unknown document type "${externalValue}" for provider ${provider}`,
      );
    }

    return found.normalizedType;
  }

  /**
   * Obtiene etiqueta legible de tipo de documento
   */
  getLabel(normalizedType: NormalizedDocumentType, provider: string): string {
    const map = this.providerMaps[provider];
    if (!map) {
      throw new Error(`No document type mapping for provider: ${provider}`);
    }

    const found = map.find((m) => m.normalizedType === normalizedType);
    if (!found) {
      return normalizedType; // Fallback: retorna el tipo normalizado
    }

    return found.label;
  }

  /**
   * Normaliza número de documento (remueve espacios, caracteres especiales)
   */
  normalizeDocumentNumber(docNumber: string | number): string {
    return String(docNumber)
      .trim()
      .replace(/[\s-.]/g, '');
  }

  /**
   * Valida formato básico de número de documento
   */
  isValidDocumentNumber(docNumber: string | number): boolean {
    const normalized = this.normalizeDocumentNumber(docNumber);
    return /^\d{6,15}$/.test(normalized); // Entre 6 y 15 dígitos
  }
}
