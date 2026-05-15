/**
 * Tipos de documento para SISBEN
 * Valores numéricos extraídos del formulario HTML
 */
export enum SisbenDocumentType {
  RC = '1', // Registro Civil
  TI = '2', // Tarjeta de Identidad
  CC = '3', // Cédula de Ciudadanía
  CE = '4', // Cédula de Extranjería
  DNI_ORIGEN = '5', // DNI (País de origen)
  DNI_PASAPORTE = '6', // DNI (Pasaporte)
  SC = '7', // Salvoconducto para refugiado
  PEP = '8', // Permiso Especial de Permanencia
  PPT = '9', // Permiso Por Protección Temporal
}
