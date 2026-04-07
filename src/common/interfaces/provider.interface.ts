import { TipoDocumento } from 'src/types/afiliado.types';

export interface Provider {
  name: string;
  timeout: number;

  getData(numDoc: number, tipoDoc: TipoDocumento): Promise<any>;
  normalize(data: any): Partial<any>;
}
