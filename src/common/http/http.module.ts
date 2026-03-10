import { Module } from '@nestjs/common';
import { HttpClientService } from './http-client.service';

/**
 * Módulo HTTP global
 * Proporciona el servicio centralizado para gestionar instancias de axios
 */
@Module({
  providers: [HttpClientService],
  exports: [HttpClientService],
})
export class HttpModule {}
