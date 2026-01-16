import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import neo4j, { Driver } from 'neo4j-driver';
import { LoggerService } from '../common/logger/logger.service';

@Injectable()
export class Neo4jService implements OnModuleInit, OnModuleDestroy {
  private driver: Driver;

  constructor(private readonly logger: LoggerService) {}

  async onModuleInit() {
    this.driver = neo4j.driver(
      process.env.NEO4J_URI,
      neo4j.auth.basic(process.env.NEO4J_USERNAME, process.env.NEO4J_PASSWORD),
    );

    try {
      const serverInfo = await this.driver.getServerInfo();
      this.logger.success(
        `Connected to Neo4j Server: ${serverInfo.address}`,
        'Neo4jService',
      );

      // Initialize constraints and indices
      await this.initSchema();
    } catch (error) {
      this.logger.failed(
        `Error connecting to Neo4j Server: ${error}`,
        'Neo4jService',
      );
      throw error;
    }
  }

  private async initSchema() {
    const session = this.getSession();
    try {
      this.logger.log('Initializing Neo4j schema...', 'Neo4jService');

      // Constraints (ensure uniqueness)
      await session.executeWrite((tx) =>
        tx.run(
          'CREATE CONSTRAINT phone_number_unique IF NOT EXISTS FOR (p:Phone) REQUIRE p.number IS UNIQUE',
        ),
      );
      await session.executeWrite((tx) =>
        tx.run(
          'CREATE CONSTRAINT account_phone_unique IF NOT EXISTS FOR (a:Account) REQUIRE a.phone IS UNIQUE',
        ),
      );
      await session.executeWrite((tx) =>
        tx.run(
          'CREATE CONSTRAINT suspect_phone_unique IF NOT EXISTS FOR (s:GlobalSuspect) REQUIRE s.phone IS UNIQUE',
        ),
      );

      // Indices (speed up lookups)
      await session.executeWrite((tx) =>
        tx.run(
          'CREATE INDEX investigation_id_index IF NOT EXISTS FOR (i:Investigation) ON (i.id)',
        ),
      );

      this.logger.log('Neo4j schema initialized successfully', 'Neo4jService');
    } catch (error) {
      this.logger.error(
        `Failed to initialize Neo4j schema: ${error}`,
        'Neo4jService',
      );
    } finally {
      await session.close();
    }
  }

  async onModuleDestroy() {
    await this.driver.close();
  }

  getSession() {
    return this.driver.session();
  }

  async readCypher(query: string, params: any = {}) {
    const session = this.getSession();

    try {
      const result = await session.executeRead((tx) => tx.run(query, params));
      return result.records;
    } finally {
      await session.close();
    }
  }

  async writeCypher(query: string, params: any = {}) {
    const session = this.getSession();

    try {
      const result = await session.executeWrite((tx) => tx.run(query, params));
      return result.records;
    } finally {
      await session.close();
    }
  }
}
