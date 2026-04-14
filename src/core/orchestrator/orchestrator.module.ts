import { Module } from '@nestjs/common';
import { OrchestratorService } from './orchestrator.service';
import { OrchestratorController } from './orchestrator.controller';
import { AdresModule } from '../providers/adres/adres.module';
import { AsoPagosModule } from '../providers/aso-pagos/aso-pagos.module';

@Module({
  imports: [AdresModule, AsoPagosModule],
  controllers: [OrchestratorController],
  providers: [OrchestratorService],
  exports: [OrchestratorService],
})
export class OrchestratorModule {}
