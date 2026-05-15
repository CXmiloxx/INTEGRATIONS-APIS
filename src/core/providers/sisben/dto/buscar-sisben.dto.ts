import {
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsString,
  Max,
  Min,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { SisbenDocumentType } from 'src/types/sisben.types';

export class BuscarSisben {
  @ApiProperty({
    enum: SisbenDocumentType,
    description: 'Tipo de documento (SISBEN formato numérico)',
    example: '3',
    enumName: 'SisbenDocumentType',
  })
  @IsString()
  @IsNotEmpty()
  @IsEnum(SisbenDocumentType)
  tipoDoc!: SisbenDocumentType;

  @ApiProperty({
    description: 'Número de documento',
    example: 1234567890,
    type: 'number',
  })
  @IsNumber({}, { message: 'Número documento debe ser válido' })
  @IsNotEmpty({ message: 'Número documento requerido' })
  @Min(10000, { message: 'Mínimo 4 dígitos' })
  @Max(999999999999999, { message: 'Máximo 15 dígitos' })
  numDoc!: number;
}
