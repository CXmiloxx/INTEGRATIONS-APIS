import { ApiProperty } from '@nestjs/swagger';

export class AsoPagosInfoDTO {
  @ApiProperty({
    description: 'Número de identificación del afiliado',
    example: '1234567890',
  })
  numeroIdentificacion?: string;

  @ApiProperty({
    description: 'Nombre del afiliado',
    example: 'Juan Pérez',
  })
  nombre?: string;

  @ApiProperty({
    description: 'Estado de aportante',
    example: 'ACTIVO',
  })
  estado?: string;

  @ApiProperty({
    description: 'Información de aportes',
    example: 'Aportes al día',
  })
  infoAportes?: string;

  @ApiProperty({
    description: 'Última fecha de pago',
    example: '2026-04-13',
  })
  ultimaFechaPago?: string;

  @ApiProperty({
    description: 'Saldo adeudado',
    example: '0',
  })
  saldoAdeudado?: string;
}

export class AsoPagosResponseDTO {
  @ApiProperty({
    description: 'Información del aportante a Aso Pagos',
  })
  informacionAportante: PdfParserResponseDTO;
}

export class PdfParserResponseDTO {
  nit?: string;
  empresa?: string;
  nombres?: string;
  apellidos?: string;
  cedula?: string;
  periodoPension?: string;
  periodoSalud?: string;
}
