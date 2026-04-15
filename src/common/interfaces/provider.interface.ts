import { TipoDocumento } from 'src/types/afiliado.types';
import { ProviderContribution } from '../dto/citizen-response.dto';

export interface Provider {
  /** Nombre interno del provider (logs, registro). */
  name: string;
  /** Clave usada en la respuesta `providers.<key>`. Mayúsculas, sin espacios. */
  responseKey: string;
  timeout: number;

  getData(numDoc: number, tipoDoc: TipoDocumento): Promise<unknown>;

  /**
   * Convierte el resultado crudo del provider en su contribución a la
   * respuesta unificada. Cada provider sabe cómo mapear sus datos a las
   * secciones `persona`, `afiliaciones` y/o `aportante`.
   */
  toContribution(data: unknown): ProviderContribution;
}
