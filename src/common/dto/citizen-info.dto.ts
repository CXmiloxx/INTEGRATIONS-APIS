import { ApiProperty } from '@nestjs/swagger';
import { PdfParserResponseDTO } from 'src/core/providers/aso-pagos/dto/aso-pagos-response.dto';
import { InformacionBasica, DatosAfiliacion } from 'src/types/afiliado.types';

export class CitizenInfoDTO {
  @ApiProperty({
    description: 'Información básica del ciudadano',
    example: {
      tipoIdentificacion: 'CC',
      numeroIdentificacion: '1234567890',
      nombres: 'Juan',
      apellidos: 'Pérez',
      fechaNacimiento: '1990-01-01',
      departamento: 'Bogotá',
      municipio: 'Bogotá D.C',
    },
  })
  adres?: {
    informacionBasica?: Partial<InformacionBasica>;
    datosAfiliacion?: Partial<DatosAfiliacion>[];
  };

  @ApiProperty({
    description: 'Datos de afiliación al sistema de salud',
    example: [
      {
        estado: 'ACTIVO',
        entidad: 'EPS Sanitas',
        regimen: 'CONTRIBUTIVO',
        fechaAfiliacionEfectiva: '2020-01-01',
        fechaFinalizacionAfiliacion: null,
        tipoAfiliado: 'Trabajador Independiente',
      },
    ],
  })
  asoPagos?: {
    informacionAportante?: PdfParserResponseDTO;
  };

  @ApiProperty({
    description: 'Metadata adicional',
    required: false,
  })
  @ApiProperty({
    description: 'Timestamp de procesamiento',
  })
  fechaProcesamiento?: string;
}
