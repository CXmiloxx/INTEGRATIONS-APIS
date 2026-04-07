import { Module } from '@nestjs/common';
import { OrchestratorService } from './orchestrator.service';
import { OrchestratorController } from './orchestrator.controller';
import { AdresModule } from '../providers/adres/adres.module';

@Module({
  imports: [AdresModule],
  controllers: [OrchestratorController],
  providers: [OrchestratorService],
  exports: [OrchestratorService],
})
export class OrchestratorModule {}
