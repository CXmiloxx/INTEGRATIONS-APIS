import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AdresService } from './adres.service';
import { AdresController } from './adres.controller';
import { TypedConfigService } from 'src/config/service/typed-config.service';
import { HttpModule } from 'src/common/http';
import { DocumentTypeMapper } from 'src/common/mappers/document-type.mapper';

@Module({
  imports: [ConfigModule, HttpModule],
  controllers: [AdresController],
  providers: [AdresService, TypedConfigService, DocumentTypeMapper],
  exports: [AdresService],
})
export class AdresModule {}
