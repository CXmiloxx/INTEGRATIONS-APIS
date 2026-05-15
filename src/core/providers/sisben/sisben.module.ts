import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { SisbenService } from './sisben.service';
import { SisbenController } from './sisben.controller';
import { TypedConfigService } from 'src/config/service/typed-config.service';
import { HttpModule } from 'src/common/http';

@Module({
  imports: [ConfigModule, HttpModule],
  controllers: [SisbenController],
  providers: [SisbenService, TypedConfigService],
  exports: [SisbenService],
})
export class SisbenModule {}
