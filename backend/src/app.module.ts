import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { Neo4jModule } from './neo4j/neo4j.module';
import { ConfigModule } from '@nestjs/config';
import { InvestigationsModule } from './investigations/investigations.module';
import { GeolocationModule } from './geolocation/geolocation.module';
import { VictimMappingModule } from './victim-mapping/victim-mapping.module';

@Module({
  imports: [ConfigModule.forRoot(), Neo4jModule, InvestigationsModule, GeolocationModule, VictimMappingModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
