export interface SisbenOficinaContacto {
  nombreAdministrador?: string;
  direccion?: string;
  telefono?: string;
  correoElectronico?: string;
}

/**
 * Resultado estructurado de la consulta pública SISBEN IV (HTML parseado).
 */
export interface SisbenConsultaResult {
  encontrado: boolean;
  /** Cuando la ficha existe y el certificado muestra “Registro válido”. */
  registroValido?: boolean;
  mensaje?: string;
  fechaConsulta?: string;
  ficha?: string;
  grupoSisben?: string;
  grupoDescripcion?: string;
  nombres?: string;
  apellidos?: string;
  tipoDocumento?: string;
  numeroDocumento?: string;
  municipio?: string;
  departamento?: string;
  encuestaVigente?: string;
  ultimaActualizacionCiudadano?: string;
  ultimaActualizacionRegistrosAdministrativos?: string;
  oficina?: SisbenOficinaContacto;
}
