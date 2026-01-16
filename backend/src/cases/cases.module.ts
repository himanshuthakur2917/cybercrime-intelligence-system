import { Module } from '@nestjs/common';
import { CasesService } from './cases.service';
import { CasesController } from './cases.controller';
import { SupabaseModule } from '../supabase/supabase.module';
import { LoggerModule } from '../common/logger/logger.module';

@Module({
  imports: [SupabaseModule, LoggerModule],
  controllers: [CasesController],
  providers: [CasesService],
  exports: [CasesService],
})
export class CasesModule {}
