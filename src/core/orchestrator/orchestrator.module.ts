import { Module } from '@nestjs/common';
import { OrchestratorService } from './orchestrator.service';
import { OrchestratorController } from './orchestrator.controller';
import { AdresModule } from '../providers/adres/adres.module';
import { AsoPagosModule } from '../providers/aso-pagos/aso-pagos.module';
import { SisbenModule } from '../providers/sisben/sisben.module';
import { DocumentTypeMapper } from 'src/common/mappers/document-type.mapper';

@Module({
  imports: [AdresModule, AsoPagosModule, SisbenModule],
  controllers: [OrchestratorController],
  providers: [OrchestratorService, DocumentTypeMapper],
  exports: [OrchestratorService],
})
export class OrchestratorModule {}
