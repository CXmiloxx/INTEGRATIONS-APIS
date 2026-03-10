export enum TipoDocumento {
  CC = 'CC', // Cédula de Ciudadanía
  TI = 'TI', // Tarjeta de Identidad
  RC = 'RC', // Registro Civil
  CE = 'CE', // Cédula de Extranjería
  PA = 'PA', // Pasaporte
  NU = 'NU', // Número Único de Identificación Personal
  AS = 'AS', // Adulto sin identificación
  MS = 'MS', // Menor sin identificación
  CD = 'CD', // Carnet diplomático
  CN = 'CN', // Certificado Nacido Vivo
  SC = 'SC', // Salvo Conducto
  PE = 'PE', // Permiso especial de permanencia
  PT = 'PT', // Permiso por protección temporal
}

// src/adres/dtos/afiliado-response.dto.ts

export class InformacionBasica {
  tipoIdentificacion: string;
  numeroIdentificacion: string;
  nombres: string;
  apellidos: string;
  fechaNacimiento: string;
  departamento: string;
  municipio: string;
}

export class DatosAfiliacion {
  estado: string;
  entidad: string;
  regimen: string;
  fechaAfiliacionEfectiva: string;
  fechaFinalizacionAfiliacion: string;
  tipoAfiliado: string;
}

export class ResultadoConsultaAfiliado {
  informacionBasica: InformacionBasica;
  datosAfiliacion: DatosAfiliacion[];
  metadata?: {
    fechaImpresion: string;
    estacionOrigen: string;
  };
}
