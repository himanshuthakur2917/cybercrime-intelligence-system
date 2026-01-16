import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { CasesModule } from './cases/cases.module';
import { LoggerModule } from './common/logger/logger.module';
import { GeolocationModule } from './geolocation/geolocation.module';
import { InvestigationsModule } from './investigations/investigations.module';
import { Neo4jModule } from './neo4j/neo4j.module';
import { SupabaseModule } from './supabase/supabase.module';
import { VictimMappingModule } from './victim-mapping/victim-mapping.module';

@Module({
  imports: [
    ConfigModule.forRoot(),
    LoggerModule,
    SupabaseModule,
    Neo4jModule,
    AuthModule,
    CasesModule,
    InvestigationsModule,
    GeolocationModule,
    VictimMappingModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
