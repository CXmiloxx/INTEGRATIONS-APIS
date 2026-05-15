import { Controller, Get, Query, BadRequestException } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { AsoPagosService } from './aso-pagos.service';
import { SearchCitizenDTO } from 'src/common/dto/search-citizen.dto';
import { DocumentTypeMapper } from 'src/common/mappers/document-type.mapper';

@ApiTags('ASO-PAGOS')
@Controller('asopagos')
export class AsoPagosController {
  constructor(
    private readonly asoPagosService: AsoPagosService,
    private readonly docTypeMapper: DocumentTypeMapper,
  ) {}

  @Get()
  @ApiOperation({
    summary: 'Consultar información de aportante en ASO-PAGOS (INTERSSI)',
    description:
      'Obtiene certificados de pago y información de aportes del sistema ASO-PAGOS',
  })
  @ApiResponse({
    status: 200,
    description: 'Información del aportante obtenida exitosamente',
    schema: {
      example: {
        status: 'success',
        data: {
          informacionAportante: {
            cedula: '1088238352',
            nombres: 'JUAN CAMILO',
            apellidos: 'GUAPACHA LARGO',
            empresa: 'FINOVA',
            nit: '901837715',
          },
        },
      },
    },
  })
  @ApiResponse({ status: 400, description: 'Parámetros inválidos' })
  @ApiResponse({ status: 404, description: 'Aportante no encontrado' })
  async consultarAsoPagos(@Query() query: SearchCitizenDTO) {
    try {
      // Convertir tipo normalizado a formato ASO-PAGOS (same as ADRES)
      const tipoDocAsoPagos = this.docTypeMapper.toAdresFormat(query.tipoDoc);

      // Realizar consulta
      const data = await this.asoPagosService.getData(
        query.numDoc,
        tipoDocAsoPagos as string,
      );

      return {
        status: 'success',
        data,
        metadata: {
          timestamp: new Date().toISOString(),
          provider: 'ASOPAGOS',
        },
      };
    } catch (error: unknown) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      throw new BadRequestException({
        status: 'error',
        message: errorMsg,
        provider: 'ASOPAGOS',
      });
    }
  }
}
