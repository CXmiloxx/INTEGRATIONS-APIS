import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty, IsNumber, Max, Min } from 'class-validator';

export enum NormalizedDocumentType {
  CC = 'CC',
  TI = 'TI',
  RC = 'RC',
  CE = 'CE',
  PA = 'PA',
  NU = 'NU',
  AS = 'AS',
  MS = 'MS',
  CD = 'CD',
  CN = 'CN',
  SC = 'SC',
  PE = 'PE',
  PT = 'PT',
}

export class SearchCitizenDTO {
  @ApiProperty({
    enum: NormalizedDocumentType,
    description: 'Tipo de documento normalizado',
    example: 'CC',
    required: true,
  })
  @IsEnum(NormalizedDocumentType)
  @IsNotEmpty()
  tipoDoc!: NormalizedDocumentType;

  @ApiProperty({
    description: 'Número de documento',
    example: 1088238352,
    required: true,
    minimum: 100000,
    maximum: 999999999999999,
  })
  @IsNumber()
  @IsNotEmpty()
  @Min(100000, {
    message: 'El número de documento debe tener al menos 6 dígitos',
  })
  @Max(999999999999999, {
    message: 'El número de documento debe tener menos de 15 dígitos',
  })
  numDoc!: number;
}
