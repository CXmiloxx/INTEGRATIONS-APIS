import { Controller, Get, Query } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiInternalServerErrorResponse,
  ApiBadRequestResponse,
} from '@nestjs/swagger';
import { AdresService } from './adres.service';
import { BuscarAfiliado } from './dto/buscar-afiliado.dto';

@ApiTags('ADRES - Consulta de Afiliados')
@Controller('adres')
export class AdresController {
  constructor(private readonly adresService: AdresService) {}

  @Get('consultar')
  @ApiOperation({
    summary: 'Consultar información de un afiliado',
    description:
      'Realiza una búsqueda en la base de datos de ADRES para obtener información detallada de un afiliado basada en su tipo y número de documento',
  })
  @ApiResponse({
    status: 200,
    description: 'Información del afiliado obtenida exitosamente',
    schema: {
      example: {
        informacionBasica: {
          tipoDocumento: 'CC',
          numeroDocumento: '1234567890',
          primerNombre: 'Juan',
          primerApellido: 'Pérez',
        },
        datosAfiliacion: {
          estado: 'ACTIVO',
          regimen: 'CONTRIBUTIVO',
          vigencia: '2026-03-09',
        },
      },
    },
  })
  @ApiBadRequestResponse({
    description: 'Solicitud inválida - Parámetros incorrectos',
    schema: {
      example: {
        statusCode: 400,
        message: 'El tipo de documento es requerido',
        error: 'Bad Request',
      },
    },
  })
  @ApiInternalServerErrorResponse({
    description: 'Error al consultar la API de ADRES',
    schema: {
      example: {
        statusCode: 500,
        message: 'Error al conectar con ADRES',
        error: 'Internal Server Error',
      },
    },
  })
  buscarAfiliado(@Query() buscarAfiliadoDto: BuscarAfiliado) {
    return this.adresService.consultarAfiliado(buscarAfiliadoDto);
  }
}
