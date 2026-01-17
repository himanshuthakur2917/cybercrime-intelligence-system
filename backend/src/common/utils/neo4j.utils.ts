import neo4j, { Integer } from 'neo4j-driver';

/**
 * Convert Neo4j Integer to native JavaScript number.
 * Neo4j uses 64-bit integers which can exceed JavaScript's safe integer range.
 * Use this for values you know are within safe range (< 2^53).
 */
export function toNativeInt(neo4jInt: Integer | number): number {
  if (typeof neo4jInt === 'number') {
    return neo4jInt;
  }
  if (neo4j.isInt(neo4jInt)) {
    return neo4jInt.toNumber();
  }
  return Number(neo4jInt);
}

/**
 * Convert Neo4j Integer to string (safe for any size).
 * Use this for IDs or large numbers that might exceed safe integer range.
 */
export function toNativeIntString(neo4jInt: Integer | number | string): string {
  if (typeof neo4jInt === 'string') {
    return neo4jInt;
  }
  if (typeof neo4jInt === 'number') {
    return neo4jInt.toString();
  }
  if (neo4j.isInt(neo4jInt)) {
    return neo4jInt.toString();
  }
  return String(neo4jInt);
}

/**
 * Convert native number to Neo4j Integer.
 */
export function toNeo4jInt(num: number): Integer {
  return neo4j.int(num);
}

/**
 * Safely extract properties from a Neo4j node, converting integers.
 */
export function extractNodeProperties<T extends Record<string, any>>(node: {
  properties: Record<string, any>;
}): T {
  const result: Record<string, any> = {};

  for (const [key, value] of Object.entries(node.properties)) {
    if (neo4j.isInt(value)) {
      result[key] = toNativeInt(value);
    } else if (
      value &&
      typeof value === 'object' &&
      'x' in value &&
      'y' in value
    ) {
      // Handle Neo4j Point type
      result[key] = {
        lat: value.y,
        lon: value.x,
      };
    } else {
      result[key] = value;
    }
  }

  return result as T;
}

/**
 * Create a Neo4j spatial point from lat/lon coordinates.
 */
export function createSpatialPoint(lat: number, lon: number): string {
  return `point({latitude: ${lat}, longitude: ${lon}})`;
}
