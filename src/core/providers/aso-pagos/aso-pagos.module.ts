import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AsoPagosService } from './aso-pagos.service';
import { TypedConfigService } from 'src/config/service/typed-config.service';
import { HttpModule } from 'src/common/http';
import { FileStorageService } from 'src/common/services/file-storage.service';
import { OcrService } from 'src/common/services/ocr.service';
import { PdfParserService } from 'src/common/services/pdf-parser.service';

@Module({
  imports: [ConfigModule, HttpModule],
  providers: [
    AsoPagosService,
    TypedConfigService,
    FileStorageService,
    OcrService,
    PdfParserService,
  ],
  exports: [AsoPagosService],
})
export class AsoPagosModule {}
