import { Controller, Get, Logger, Query } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiInternalServerErrorResponse,
} from '@nestjs/swagger';
import { SisbenService } from './sisben.service';
import { BuscarSisben } from './dto/buscar-sisben.dto';

@ApiTags('SISBEN - Consultas Específicas')
@Controller('sisben')
export class SisbenController {
  private readonly logger = new Logger(SisbenController.name);

  constructor(private readonly sisbenService: SisbenService) {}

  @Get()
  @ApiOperation({
    summary: 'Consultar SISBEN',
    description: 'Consulta información del ciudadano en SISBEN',
  })
  @ApiResponse({
    status: 200,
    description: 'Consulta realizada exitosamente',
  })
  @ApiInternalServerErrorResponse({
    description: 'Error inesperado al consultar SISBEN',
  })
  async consultarSisben(@Query() buscarSisbenDto: BuscarSisben) {
    this.logger.log(`GET /sisben/${buscarSisbenDto.numDoc}`);
    return await this.sisbenService.consultarAfiliado(buscarSisbenDto);
  }
}
