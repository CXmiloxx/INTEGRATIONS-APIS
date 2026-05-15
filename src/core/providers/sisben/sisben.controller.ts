import { Controller, Get, Logger, Query, BadRequestException } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiInternalServerErrorResponse,
} from '@nestjs/swagger';
import { SisbenService } from './sisben.service';
import { BuscarSisben } from './dto/buscar-sisben.dto';
import {
  SearchCitizenDTO,
} from 'src/common/dto/search-citizen.dto';
import { DocumentTypeMapper } from 'src/common/mappers/document-type.mapper';

@ApiTags('SISBEN')
@Controller('sisben')
export class SisbenController {
  private readonly logger = new Logger(SisbenController.name);

  constructor(
    private readonly sisbenService: SisbenService,
    private readonly docTypeMapper: DocumentTypeMapper,
  ) {}

  @Get()
  @ApiOperation({
    summary: 'Consultar información de ciudadano en SISBEN',
    description:
      'Obtiene información de registro del Sistema de Selección de Beneficiarios',
  })
  @ApiResponse({
    status: 200,
    description: 'Consulta realizada exitosamente',
    schema: {
      example: {
        status: 'success',
        data: {
          encontrado: true,
          registroValido: true,
          nombres: 'JUAN CAMILO',
          apellidos: 'GUAPACHA LARGO',
          grupoSisben: 'B5',
          grupoDescripcion: 'Pobreza moderada',
        },
      },
    },
  })
  @ApiResponse({ status: 400, description: 'Parámetros inválidos' })
  @ApiResponse({ status: 404, description: 'Ciudadano no encontrado' })
  @ApiInternalServerErrorResponse({
    description: 'Error inesperado al consultar SISBEN',
  })
  async consultarSisben(@Query() query: SearchCitizenDTO) {
    this.logger.log(`GET /api/v1/sisben - ${query.numDoc}`);
    try {
      // Convertir tipo normalizado a formato SISBEN
      const tipoDocSisben = this.docTypeMapper.toSisbenFormat(query.tipoDoc);

      // Crear DTO para sisben con tipo convertido
      const buscarSisbenDto: BuscarSisben = {
        tipoDoc: tipoDocSisben,
        numDoc: query.numDoc,
      };

      // Realizar consulta
      const data = await this.sisbenService.consultarAfiliado(buscarSisbenDto);

      return {
        status: 'success',
        data: data.data,
        metadata: {
          timestamp: new Date().toISOString(),
          provider: 'SISBEN',
        },
      };
    } catch (error: unknown) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      this.logger.error(`Error consultando SISBEN: ${errorMsg}`);
      throw new BadRequestException({
        status: 'error',
        message: errorMsg,
        provider: 'SISBEN',
      });
    }
  }
}
