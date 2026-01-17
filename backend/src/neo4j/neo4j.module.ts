import { Global, Module } from '@nestjs/common';
import { Neo4jService } from './neo4j.service';
import { LoggerModule } from '../common/logger/logger.module';

@Global()
@Module({
  imports: [LoggerModule],
  providers: [Neo4jService],
  exports: [Neo4jService],
})
export class Neo4jModule {}
