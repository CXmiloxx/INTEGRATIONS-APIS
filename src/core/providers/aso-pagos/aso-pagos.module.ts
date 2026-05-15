import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AsoPagosService } from './aso-pagos.service';
import { AsoPagosController } from './aso-pagos.controller';
import { TypedConfigService } from 'src/config/service/typed-config.service';
import { HttpModule } from 'src/common/http';
import { OcrService } from 'src/common/services/ocr.service';
import { PdfParserService } from 'src/common/services/pdf-parser.service';
import { DocumentTypeMapper } from 'src/common/mappers/document-type.mapper';

@Module({
  imports: [ConfigModule, HttpModule],
  controllers: [AsoPagosController],
  providers: [
    AsoPagosService,
    TypedConfigService,
    OcrService,
    PdfParserService,
    DocumentTypeMapper,
  ],
  exports: [AsoPagosService],
})
export class AsoPagosModule {}
