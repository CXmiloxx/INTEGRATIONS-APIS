import {
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsString,
  Max,
  Min,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { TipoDocumento } from 'src/types/afiliado.types';

export class BuscarAfiliado {
  @ApiProperty({
    enum: TipoDocumento,
    description: 'Tipo de documento de identidad',
    example: 'CC',
    enumName: 'TipoDocumento',
  })
  @IsString()
  @IsNotEmpty()
  @IsEnum(TipoDocumento)
  tipoDoc!: TipoDocumento;

  @ApiProperty({
    description: 'Número de documento de identidad',
    example: 1234567890,
    type: 'number',
    required: true,
    minLength: 6,
    maxLength: 15,
  })
  @IsNumber({}, { message: 'El número de documento debe ser un número válido' })
  @IsNotEmpty({ message: 'El número de documento es requerido' })
  @Min(10000, {
    message: 'El número de documento debe tener al menos 4 dígitos',
  })
  @Max(999999999999999, {
    message: 'El número de documento debe tener menos de 15 dígitos',
  })
  numDoc!: number;
}
