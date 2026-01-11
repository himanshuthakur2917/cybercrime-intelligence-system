import neo4j, { Driver } from 'neo4j-driver';

let driver: Driver | null = null;

export const getNeo4jDriver = (): Driver => {
  if (driver) {
    return driver;
  }

  const uri = process.env.NEO4J_URI || 'bolt://localhost:7687';
  const username = process.env.NEO4J_USERNAME || 'neo4j';
  const password = process.env.NEO4J_PASSWORD || 'password';

  driver = neo4j.driver(uri, neo4j.auth.basic(username, password), {
    maxConnectionPoolSize: 50,
    connectionAcquisitionTimeout: 30000,
  });

  return driver;
};

export const closeNeo4jDriver = async (): Promise<void> => {
  if (driver) {
    await driver.close();
    driver = null;
  }
};

export const executeQuery = async (
  query: string,
  parameters: Record<string, any> = {}
): Promise<any[]> => {
  const driver = getNeo4jDriver();
  const session = driver.session();

  try {
    const result = await session.run(query, parameters);
    return result.records.map((record) => record.toObject());
  } finally {
    await session.close();
  }
};

export const executeWriteQuery = async (
  query: string,
  parameters: Record<string, any> = {}
): Promise<any[]> => {
  const driver = getNeo4jDriver();
  const session = driver.session({ defaultAccessMode: neo4j.session.WRITE });

  try {
    const result = await session.run(query, parameters);
    return result.records.map((record) => record.toObject());
  } finally {
    await session.close();
  }
};
