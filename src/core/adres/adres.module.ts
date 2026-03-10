import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AdresService } from './adres.service';
import { AdresController } from './adres.controller';
import { TypedConfigService } from 'src/config/service/typed-config.service';
import { HttpModule } from 'src/common/http';

@Module({
  imports: [ConfigModule, HttpModule],
  controllers: [AdresController],
  providers: [AdresService, TypedConfigService],
})
export class AdresModule {}
