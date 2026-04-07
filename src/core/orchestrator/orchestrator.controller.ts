import { Controller, Get, Logger, Query } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiInternalServerErrorResponse,
} from '@nestjs/swagger';
import { OrchestratorService } from './orchestrator.service';
import { CitizenInfoDTO } from 'src/common/dto/citizen-info.dto';
import { BuscarAfiliado } from '../providers/adres/dto/buscar-afiliado.dto';

@ApiTags('Ciudadano - Información Consolidada')
@Controller('citizen')
export class OrchestratorController {
  private readonly logger = new Logger(OrchestratorController.name);

  constructor(private readonly orchestratorService: OrchestratorService) {}

  @Get(':cedula')
  @ApiOperation({
    summary: 'Obtener información consolidada de un ciudadano',
    description:
      'Consulta información consolidada del ciudadano desde múltiples proveedores (actualmente ADRES)',
  })
  @ApiParam({
    name: 'cedula',
    description: 'Número de cédula del ciudadano',
    example: '1234567890',
    type: 'string',
  })
  @ApiResponse({
    status: 200,
    description: 'Información del ciudadano obtenida exitosamente',
    type: CitizenInfoDTO,
    schema: {
      example: {
        informacionBasica: {
          tipoIdentificacion: 'CC',
          numeroIdentificacion: '1234567890',
          nombres: 'Juan',
          apellidos: 'Pérez',
          fechaNacimiento: '1990-01-01',
          departamento: 'Bogotá',
          municipio: 'Bogotá D.C',
        },
        salud: {
          eps: 'EPS Sanitas',
          estado: 'ACTIVO',
          regimen: 'CONTRIBUTIVO',
          datosAfiliacion: [
            {
              estado: 'ACTIVO',
              entidad: 'EPS Sanitas',
              regimen: 'CONTRIBUTIVO',
              fechaAfiliacionEfectiva: '2020-01-01',
              tipoAfiliado: 'Trabajador Independiente',
            },
          ],
        },
        fechaProcesamiento: '2026-04-07T12:30:00Z',
      },
    },
  })
  @ApiInternalServerErrorResponse({
    description:
      'Error al consultar los proveedores de información o procesar los datos',
    schema: {
      example: {
        statusCode: 500,
        message:
          'No se pudo obtener información del ciudadano de los proveedores disponibles',
        error: 'Internal Server Error',
      },
    },
  })
  async obtenerInfoCiudadano(
    @Query() buscarAfiliadoDto: BuscarAfiliado,
  ): Promise<CitizenInfoDTO> {
    this.logger.log(`GET /citizen/${buscarAfiliadoDto.numDoc}`);
    return await this.orchestratorService.obtenerInfoCiudadano(
      buscarAfiliadoDto,
    );
  }
}
