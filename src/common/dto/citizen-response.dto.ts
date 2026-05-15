import { ApiProperty } from '@nestjs/swagger';

export type ProviderResponseStatus = 'success' | 'not_found' | 'error';

export class ProviderStatusDTO {
  @ApiProperty({
    description: 'Estado de la consulta al proveedor',
    enum: ['success', 'not_found', 'error'],
    example: 'success',
  })
  status: ProviderResponseStatus;

  @ApiProperty({
    description: 'Mensaje adicional cuando el estado no es success',
    required: false,
    example: 'No se encontró información del empleado',
  })
  message?: string;
}

export class UbicacionDTO {
  @ApiProperty({ example: 'RISARALDA', required: false })
  departamento?: string;

  @ApiProperty({ example: 'PEREIRA', required: false })
  municipio?: string;
}

export class PersonaDTO {
  @ApiProperty({ example: 'CC', required: false })
  tipoIdentificacion?: string;

  @ApiProperty({ example: '1032249209', required: false })
  numeroIdentificacion?: string;

  @ApiProperty({ example: 'JUAN CAMILO', required: false })
  nombres?: string;

  @ApiProperty({ example: 'GUAPACHA LARGO', required: false })
  apellidos?: string;

  @ApiProperty({ example: null, required: false, nullable: true })
  fechaNacimiento?: string | null;

  @ApiProperty({ type: UbicacionDTO })
  ubicacion: UbicacionDTO;
}

export class AfiliacionDTO {
  @ApiProperty({ example: 'ADRES' })
  fuente: string;

  @ApiProperty({ example: 'ACTIVO', required: false })
  estado?: string;

  @ApiProperty({ example: 'ASMET SALUD EPS', required: false })
  entidad?: string;

  @ApiProperty({ example: 'CONTRIBUTIVO', required: false })
  regimen?: string;

  @ApiProperty({ example: '2014-11-12', required: false, nullable: true })
  fechaInicio?: string | null;

  @ApiProperty({ example: null, required: false, nullable: true })
  fechaFin?: string | null;

  @ApiProperty({ example: 'COTIZANTE', required: false })
  tipo?: string;
}

export class PeriodosAportanteDTO {
  @ApiProperty({ example: '2026-01', required: false })
  pension?: string;

  @ApiProperty({ example: '2026-02', required: false })
  salud?: string;
}

export class AportanteDTO {
  @ApiProperty({ example: 'ASOPAGOS' })
  fuente: string;

  @ApiProperty({ example: '901837715', required: false })
  nit?: string;

  @ApiProperty({ example: 'FINOVA', required: false })
  empresa?: string;

  @ApiProperty({ type: PeriodosAportanteDTO, required: false })
  periodos?: PeriodosAportanteDTO;
}

export class SisbenOficinaDTO {
  @ApiProperty({ example: 'SANDRA MILENA PEREZ VELEZ', required: false })
  nombreAdministrador?: string;

  @ApiProperty({ example: 'Carrera 6 No 5 - 13', required: false })
  direccion?: string;

  @ApiProperty({ example: '3563015 Extensión 120', required: false })
  telefono?: string;

  @ApiProperty({ example: 'sisben@quinchia-risaralda.gov.co', required: false })
  correoElectronico?: string;
}

export class SisbenDataDTO {
  @ApiProperty({ example: 'B5', required: false })
  grupoSisben?: string;

  @ApiProperty({ example: 'Pobreza moderada', required: false })
  grupoDescripcion?: string;

  @ApiProperty({ example: '66594016512000000590', required: false })
  ficha?: string;

  @ApiProperty({ example: '15/05/2026', required: false })
  fechaConsulta?: string;

  @ApiProperty({ example: '25/09/2019', required: false })
  encuestaVigente?: string;

  @ApiProperty({ example: '31/08/2025', required: false })
  ultimaActualizacionCiudadano?: string;

  @ApiProperty({ example: '28/02/2026', required: false })
  ultimaActualizacionRegistrosAdministrativos?: string;

  @ApiProperty({ type: SisbenOficinaDTO, required: false })
  oficina?: SisbenOficinaDTO;
}

export class CitizenDataDTO {
  @ApiProperty({ type: PersonaDTO, nullable: true })
  persona: PersonaDTO | null;

  @ApiProperty({ type: [AfiliacionDTO] })
  afiliaciones: AfiliacionDTO[];

  @ApiProperty({ type: AportanteDTO, nullable: true })
  aportante: AportanteDTO | null;

  @ApiProperty({ type: SisbenDataDTO, nullable: true, required: false })
  sisbenData?: SisbenDataDTO | null;
}

export class MetaDTO {
  @ApiProperty({ example: '2026-04-15T13:27:44.453Z' })
  timestamp: string;

  @ApiProperty({ required: false, example: 'uuid-opcional' })
  requestId?: string;
}

export interface ProviderContribution {
  persona?: Partial<PersonaDTO>;
  afiliaciones?: AfiliacionDTO[];
  aportante?: AportanteDTO;
  sisbenData?: SisbenDataDTO;
}

export class CitizenResponseDTO {
  @ApiProperty({ type: MetaDTO })
  meta: MetaDTO;

  @ApiProperty({ type: CitizenDataDTO })
  data: CitizenDataDTO;

  @ApiProperty({
    description: 'Estado de la consulta a cada proveedor',
    example: {
      ADRES: { status: 'success' },
      ASOPAGOS: {
        status: 'not_found',
        message: 'No se encontró información del empleado',
      },
    },
  })
  providers: Record<string, ProviderStatusDTO>;
}
