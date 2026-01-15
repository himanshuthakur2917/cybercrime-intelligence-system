import { Module } from '@nestjs/common';
import { AdminController } from './admin.controller';
import { TowerIngestionService } from './tower-ingestion.service';
import { SuspectIngestionService } from './suspect-ingestion.service';

@Module({
  controllers: [AdminController],
  providers: [TowerIngestionService, SuspectIngestionService],
  exports: [TowerIngestionService, SuspectIngestionService],
})
export class AdminModule {}
