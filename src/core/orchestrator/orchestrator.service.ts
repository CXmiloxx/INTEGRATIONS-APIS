import {
  Injectable,
  Logger,
  InternalServerErrorException,
} from '@nestjs/common';
import { AdresService } from '../providers/adres/adres.service';
import { CitizenInfoDTO } from 'src/common/dto/citizen-info.dto';
import { BuscarAfiliado } from '../providers/adres/dto/buscar-afiliado.dto';

@Injectable()
export class OrchestratorService {
  private readonly logger = new Logger(OrchestratorService.name);

  constructor(private readonly adresService: AdresService) {}

  async obtenerInfoCiudadano(
    buscarAfiliadoDto: BuscarAfiliado,
  ): Promise<CitizenInfoDTO> {
    this.logger.log(
      `🔄 Orquestando consulta para cédula: ${buscarAfiliadoDto.numDoc}`,
    );

    try {
      // Ejecutar providers en paralelo (actualmente solo ADRES)
      const results = await Promise.allSettled([
        this.adresService.getData(
          buscarAfiliadoDto.numDoc,
          buscarAfiliadoDto.tipoDoc,
        ),
      ]);

      // Normalizar datos desde providers
      const datosNormalizados = results
        .map((result, index) => {
          if (result.status === 'fulfilled') {
            try {
              return this.adresService.normalize(result.value.data);
            } catch (error) {
              this.logger.error(
                `Error normalizando datos del provider ${index}: ${error}`,
              );
              return null;
            }
          }
          return null;
        })
        .filter((dato) => dato !== null);

      if (datosNormalizados.length === 0) {
        this.logger.error('❌ No se obtuvieron datos de ningún provider');
        throw new InternalServerErrorException(
          'No se pudo obtener información del ciudadano de los proveedores disponibles',
        );
      }

      // Ensamblar respuesta final
      const respuestaFinal = this.ensamblarRespuesta(datosNormalizados);

      this.logger.log(
        `✅ Información de ciudadano obtenida exitosamente: ${buscarAfiliadoDto.numDoc}`,
      );

      return respuestaFinal;
    } catch (error) {
      this.logger.error(
        `❌ Error en orquestación: ${error instanceof Error ? error.message : error}`,
      );
      throw error;
    }
  }

  private ensamblarRespuesta(
    datosNormalizados: Partial<CitizenInfoDTO>[],
  ): CitizenInfoDTO {
    const respuesta: CitizenInfoDTO = {};

    // Usar primer resultado normalizado como base
    const primero = datosNormalizados[0];

    if (primero) {
      respuesta.adres = primero.adres;
      respuesta.salud = primero.salud;
      respuesta.metadata = primero.metadata;
      respuesta.fechaProcesamiento = primero.fechaProcesamiento;
    }

    this.logger.log('🔗 Respuesta ensamblada exitosamente');

    return respuesta;
  }
}
