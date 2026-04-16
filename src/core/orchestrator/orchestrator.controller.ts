import { Controller, Get, Logger, Query } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiInternalServerErrorResponse,
} from '@nestjs/swagger';
import { OrchestratorService } from './orchestrator.service';
import { CitizenResponseDTO } from 'src/common/dto/citizen-response.dto';
import { BuscarAfiliado } from '../providers/adres/dto/buscar-afiliado.dto';

@ApiTags('Ciudadano - Información Consolidada')
@Controller('citizen')
export class OrchestratorController {
  private readonly logger = new Logger(OrchestratorController.name);

  constructor(private readonly orchestratorService: OrchestratorService) {}

  @Get()
  @ApiOperation({
    summary: 'Obtener información consolidada de un ciudadano',
    description:
      'Consulta información consolidada del ciudadano desde múltiples proveedores (ADRES y ASOPAGOS)',
  })
  @ApiParam({
    name: 'cedula',
    description: 'Número de cédula del ciudadano',
    example: '1032249209',
    type: 'string',
  })
  @ApiResponse({
    status: 200,
    description: 'Información del ciudadano obtenida',
    type: CitizenResponseDTO,
    schema: {
      example: {
        meta: { timestamp: '2026-04-15T13:27:44.453Z' },
        data: {
          persona: {
            tipoIdentificacion: 'CC',
            numeroIdentificacion: '1032249209',
            nombres: 'JUAN CAMILO',
            apellidos: 'GUAPACHA LARGO',
            fechaNacimiento: null,
            ubicacion: {
              departamento: 'RISARALDA',
              municipio: 'QUINCHIA',
            },
          },
          afiliaciones: [
            {
              fuente: 'ADRES',
              estado: 'ACTIVO',
              entidad: 'ASMET SALUD EPS',
              regimen: 'CONTRIBUTIVO',
              fechaInicio: '2014-11-12',
              fechaFin: null,
              tipo: 'COTIZANTE',
            },
          ],
          aportante: {
            fuente: 'ASOPAGOS',
            nit: '901837715',
            empresa: 'FINOVA',
            periodos: { pension: '2026-01', salud: '2026-02' },
          },
        },
        providers: {
          ADRES: { status: 'success' },
          ASOPAGOS: { status: 'success' },
        },
      },
    },
  })
  @ApiInternalServerErrorResponse({
    description: 'Error inesperado al consultar los proveedores',
    schema: {
      example: {
        statusCode: 500,
        message: 'Error interno del servidor',
        error: 'Internal Server Error',
      },
    },
  })
  async obtenerInfoCiudadano(
    @Query() buscarAfiliadoDto: BuscarAfiliado,
  ): Promise<CitizenResponseDTO> {
    this.logger.log(`GET /citizen/${buscarAfiliadoDto.numDoc}`);
    return await this.orchestratorService.obtenerInfoCiudadano(
      buscarAfiliadoDto,
    );
  }
}
