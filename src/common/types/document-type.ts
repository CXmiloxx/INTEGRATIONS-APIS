/**
 * Tipos de documento normalizados (independientes de servicio)
 * Cada servicio mapea sus valores propios a estos tipos genéricos
 */
export enum NormalizedDocumentType {
  CC = 'CC', // Cédula Ciudadanía
  TI = 'TI', // Tarjeta Identidad
  RC = 'RC', // Registro Civil
  CE = 'CE', // Cédula Extranjería
  PA = 'PA', // Pasaporte
  DNI = 'DNI', // DNI (Pais origen)
  SC = 'SC', // Salvoconducto
  PEP = 'PEP', // Permiso Especial Permanencia
  PPT = 'PPT', // Permiso Protección Temporal
}

/**
 * Interfaz para mapeo de tipos por servicio
 */
export interface DocumentTypeMap {
  // Valor que espera el servicio externo
  externalValue: string | number;
  // Tipo normalizado
  normalizedType: NormalizedDocumentType;
  // Etiqueta legible
  label: string;
}

/**
 * Mapeo ADRES (valores string)
 */
export const ADRES_DOCUMENT_TYPES: DocumentTypeMap[] = [
  {
    externalValue: 'CC',
    normalizedType: NormalizedDocumentType.CC,
    label: 'Cédula de Ciudadanía',
  },
  {
    externalValue: 'TI',
    normalizedType: NormalizedDocumentType.TI,
    label: 'Tarjeta de Identidad',
  },
  {
    externalValue: 'RC',
    normalizedType: NormalizedDocumentType.RC,
    label: 'Registro Civil',
  },
  {
    externalValue: 'CE',
    normalizedType: NormalizedDocumentType.CE,
    label: 'Cédula de Extranjería',
  },
  {
    externalValue: 'PA',
    normalizedType: NormalizedDocumentType.PA,
    label: 'Pasaporte',
  },
  {
    externalValue: 'SC',
    normalizedType: NormalizedDocumentType.SC,
    label: 'Salvoconducto para refugiado',
  },
  {
    externalValue: 'PE',
    normalizedType: NormalizedDocumentType.PEP,
    label: 'Permiso Especial de Permanencia',
  },
  {
    externalValue: 'PT',
    normalizedType: NormalizedDocumentType.PPT,
    label: 'Permiso Por Protección Temporal',
  },
];

/**
 * Mapeo SISBEN (valores numéricos del HTML)
 */
export const SISBEN_DOCUMENT_TYPES: DocumentTypeMap[] = [
  {
    externalValue: '1',
    normalizedType: NormalizedDocumentType.RC,
    label: 'Registro Civil',
  },
  {
    externalValue: '2',
    normalizedType: NormalizedDocumentType.TI,
    label: 'Tarjeta de Identidad',
  },
  {
    externalValue: '3',
    normalizedType: NormalizedDocumentType.CC,
    label: 'Cédula de Ciudadanía',
  },
  {
    externalValue: '4',
    normalizedType: NormalizedDocumentType.CE,
    label: 'Cédula de extranjería',
  },
  {
    externalValue: '5',
    normalizedType: NormalizedDocumentType.DNI,
    label: 'DNI (País de origen)',
  },
  {
    externalValue: '6',
    normalizedType: NormalizedDocumentType.DNI,
    label: 'DNI (Pasaporte)',
  },
  {
    externalValue: '7',
    normalizedType: NormalizedDocumentType.SC,
    label: 'Salvoconducto para refugiado',
  },
  {
    externalValue: '8',
    normalizedType: NormalizedDocumentType.PEP,
    label: 'Permiso Especial de Permanencia',
  },
  {
    externalValue: '9',
    normalizedType: NormalizedDocumentType.PPT,
    label: 'Permiso Por Protección Temporal',
  },
];

/**
 * Función helper para obtener mapeo de un servicio
 */
export function getDocumentTypeMap(
  serviceName: 'adres' | 'sisben' | string,
): DocumentTypeMap[] {
  switch (serviceName.toLowerCase()) {
    case 'adres':
      return ADRES_DOCUMENT_TYPES;
    case 'sisben':
      return SISBEN_DOCUMENT_TYPES;
    default:
      throw new Error(`No document type mapping for service: ${serviceName}`);
  }
}

/**
 * Convertir valor externo a tipo normalizado
 */
export function toNormalizedType(
  externalValue: string | number,
  serviceName: string,
): NormalizedDocumentType {
  const map = getDocumentTypeMap(serviceName);
  const found = map.find((m) => m.externalValue === externalValue);
  if (!found) {
    throw new Error(
      `Unknown document type "${externalValue}" for service ${serviceName}`,
    );
  }
  return found.normalizedType;
}

/**
 * Convertir tipo normalizado a valor externo
 */
export function toExternalValue(
  normalizedType: NormalizedDocumentType,
  serviceName: string,
): string | number {
  const map = getDocumentTypeMap(serviceName);
  const found = map.find((m) => m.normalizedType === normalizedType);
  if (!found) {
    throw new Error(
      `Cannot map normalized type "${normalizedType}" to service ${serviceName}`,
    );
  }
  return found.externalValue;
}
