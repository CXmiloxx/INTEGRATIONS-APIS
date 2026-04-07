import { ApiProperty } from '@nestjs/swagger';
import { InformacionBasica, DatosAfiliacion } from 'src/types/afiliado.types';

export class AdresResponseDTO {
  @ApiProperty({
    description: 'Información básica del afiliado',
  })
  informacionBasica: Partial<InformacionBasica>;

  @ApiProperty({
    description: 'Datos de afiliación',
    type: [Object],
  })
  datosAfiliacion: Partial<DatosAfiliacion>[];

  @ApiProperty({
    description: 'Metadata de la consulta',
    required: false,
  })
  metadata?: {
    fechaImpresion?: string;
    estacionOrigen?: string;
  };
}
