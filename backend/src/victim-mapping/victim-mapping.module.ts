import { Module } from '@nestjs/common';
import { VictimMappingService } from './victim-mapping.service';
import { VictimMappingController } from './victim-mapping.controller';

@Module({
  providers: [VictimMappingService],
  controllers: [VictimMappingController],
  exports: [VictimMappingService],
})
export class VictimMappingModule {}
