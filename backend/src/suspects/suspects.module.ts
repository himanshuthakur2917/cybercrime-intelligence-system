import { Module } from '@nestjs/common';
import { SuspectsService } from './suspects.service';
import { SuspectsController } from './suspects.controller';
import { Neo4jModule } from '../neo4j/neo4j.module';
import { LoggerModule } from '../common/logger/logger.module';

@Module({
  imports: [Neo4jModule, LoggerModule],
  controllers: [SuspectsController],
  providers: [SuspectsService],
  exports: [SuspectsService],
})
export class SuspectsModule {}
