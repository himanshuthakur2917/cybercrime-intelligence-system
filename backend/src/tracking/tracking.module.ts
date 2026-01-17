import { Module } from '@nestjs/common';
import { SuspectTrackingService } from './suspect-tracking.service';

@Module({
  providers: [SuspectTrackingService],
  exports: [SuspectTrackingService],
})
export class TrackingModule {}
