import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import neo4j, { Driver } from 'neo4j-driver';

@Injectable()
export class Neo4jService implements OnModuleInit, OnModuleDestroy {
  private driver: Driver;

  async onModuleInit() {
    this.driver = neo4j.driver(
      process.env.NEO4J_URI!,
      neo4j.auth.basic(
        process.env.NEO4J_USERNAME!,
        process.env.NEO4J_PASSWORD!,
      ),
    );

    try {
      const serverInfo = await this.driver.getServerInfo();
      console.log('Connected to Neo4j Server:', serverInfo);
    } catch (error) {
      console.error('Error connecting to Neo4j Server:', error);
      throw error;
    }
  }

  async onModuleDestroy() {
    await this.driver.close();
  }

  getSession() {
    return this.driver.session();
  }

  async readCypher(query: string, params: Record<string, any> = {}) {
    const session = this.getSession();

    try {
      const result = await session.executeRead((tx) => tx.run(query, params));
      return result.records;
    } finally {
      await session.close();
    }
  }

  async writeCypher(query: string, params: Record<string, any> = {}) {
    const session = this.getSession();

    try {
      const result = await session.executeWrite((tx) => tx.run(query, params));
      return result.records;
    } finally {
      await session.close();
    }
  }
}
