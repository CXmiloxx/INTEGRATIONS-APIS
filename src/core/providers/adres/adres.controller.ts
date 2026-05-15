import { Controller, Get, Query, BadRequestException } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { AdresService } from './adres.service';
import { SearchCitizenDTO } from 'src/common/dto/search-citizen.dto';
import { DocumentTypeMapper } from 'src/common/mappers/document-type.mapper';

@ApiTags('ADRES')
@Controller('adres')
export class AdresController {
  constructor(
    private readonly adresService: AdresService,
    private readonly docTypeMapper: DocumentTypeMapper,
  ) {}

  @Get()
  @ApiOperation({
    summary: 'Consultar información de afiliado en ADRES',
    description:
      'Obtiene información de afiliación del sistema de salud colombiano',
  })
  @ApiResponse({
    status: 200,
    description: 'Información del afiliado obtenida exitosamente',
    schema: {
      example: {
        status: 'success',
        data: {
          informacionBasica: {
            tipoIdentificacion: 'CC',
            numeroIdentificacion: '1088238352',
            nombres: 'JUAN CAMILO',
            apellidos: 'GUAPACHA LARGO',
          },
          datosAfiliacion: [],
        },
      },
    },
  })
  @ApiResponse({ status: 400, description: 'Parámetros inválidos' })
  @ApiResponse({ status: 404, description: 'Afiliado no encontrado' })
  async consultarAdres(@Query() query: SearchCitizenDTO) {
    try {
      // Convertir tipo normalizado a formato ADRES
      const tipoDocAdres = this.docTypeMapper.toAdresFormat(query.tipoDoc);

      // Realizar consulta
      const data = await this.adresService.getData(
        query.numDoc,
        tipoDocAdres as string,
      );

      return {
        status: 'success',
        data,
        metadata: {
          timestamp: new Date().toISOString(),
          provider: 'ADRES',
        },
      };
    } catch (error: unknown) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      throw new BadRequestException({
        status: 'error',
        message: errorMsg,
        provider: 'ADRES',
      });
    }
  }
}
