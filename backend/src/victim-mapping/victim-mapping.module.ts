import { Module } from '@nestjs/common';
import { VictimMappingService } from './victim-mapping.service';
import { VictimMappingController } from './victim-mapping.controller';
import { SupabaseModule } from 'src/supabase/supabase.module';

@Module({
  imports: [SupabaseModule],
  providers: [VictimMappingService],
  controllers: [VictimMappingController],
  exports: [VictimMappingService],
})
export class VictimMappingModule {}
