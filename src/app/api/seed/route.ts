import { executeWriteQuery } from '@/lib/neo4j/client';
import {
    connectKingpinNetwork,
    createBidirectionalKingpinCommunication,
    createCase,
    createEvidence,
    createInvestigation,
    createKingpinNetwork,
    createSuspect
} from '@/lib/neo4j/queries';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    // Clear existing data
    await executeWriteQuery('MATCH (n) DETACH DELETE n');

    // Create Investigation nodes for S1
    await createInvestigation({
      id: 'inv_001',
      name: 'Operation Nexus',
      status: 'Active',
      startDate: '2024-01-15',
    });

    await createInvestigation({
      id: 'inv_002',
      name: 'Case Gold Eagle',
      status: 'Active',
      startDate: '2024-02-10',
    });

    await createInvestigation({
      id: 'inv_003',
      name: 'Project Shadow',
      status: 'Closed',
      startDate: '2023-06-20',
    });

    // Create relationships between investigations (S1)
    await executeWriteQuery(`
      MATCH (i1:Investigation {id: 'inv_001'})
      MATCH (i2:Investigation {id: 'inv_002'})
      CREATE (i1)-[:RELATED_TO {reason: 'Same suspect network'}]->(i2)
    `);

    await executeWriteQuery(`
      MATCH (i2:Investigation {id: 'inv_002'})
      MATCH (i3:Investigation {id: 'inv_003'})
      CREATE (i2)-[:RELATED_TO {reason: 'Evidence overlap'}]->(i3)
    `);

    // Create Suspect nodes for S2
    await createSuspect({
      id: 'susp_001',
      name: 'John Doe',
      status: 'Wanted',
      riskLevel: 'High',
    });

    await createSuspect({
      id: 'susp_002',
      name: 'Jane Smith',
      status: 'Monitoring',
      riskLevel: 'Medium',
    });

    await createSuspect({
      id: 'susp_003',
      name: 'Robert Johnson',
      status: 'Detained',
      riskLevel: 'Critical',
    });

    // Create Case nodes
    await createCase({
      id: 'case_001',
      title: 'Diamond Heist - Downtown',
      status: 'Investigating',
      priority: 'High',
    });

    await createCase({
      id: 'case_002',
      title: 'Cargo Theft - Port Authority',
      status: 'Investigating',
      priority: 'High',
    });

    await createCase({
      id: 'case_003',
      title: 'Counterfeiting Ring',
      status: 'Closed',
      priority: 'Critical',
    });

    // Create relationships between suspects and cases (S2)
    await executeWriteQuery(`
      MATCH (s:Suspect {id: 'susp_001'})
      MATCH (c:Case {id: 'case_001'})
      CREATE (s)-[:INVOLVED_IN {role: 'Primary Suspect', since: '2024-01-20'}]->(c)
    `);

    await executeWriteQuery(`
      MATCH (s:Suspect {id: 'susp_002'})
      MATCH (c:Case {id: 'case_001'})
      CREATE (s)-[:INVOLVED_IN {role: 'Accomplice', since: '2024-01-22'}]->(c)
    `);

    await executeWriteQuery(`
      MATCH (s:Suspect {id: 'susp_003'})
      MATCH (c:Case {id: 'case_003'})
      CREATE (s)-[:INVOLVED_IN {role: 'Ring Leader', since: '2023-08-15'}]->(c)
    `);

    // Create Vehicle nodes for S2
    await executeWriteQuery(`
      CREATE (v:Vehicle {id: 'veh_001', make: 'BMW', model: 'M5', plate: 'ABC123', color: 'Black'})
    `);

    await executeWriteQuery(`
      MATCH (c:Case {id: 'case_001'})
      MATCH (v:Vehicle {id: 'veh_001'})
      CREATE (c)-[:INVOLVES {role: 'Getaway vehicle'}]->(v)
    `);

    // Create Evidence nodes for S3
    await createEvidence({
      id: 'evid_001',
      type: 'Fingerprint',
      description: 'Fingerprints found on safe',
      foundDate: '2024-01-16',
    });

    await createEvidence({
      id: 'evid_002',
      type: 'DNA',
      description: 'DNA sample from crime scene',
      foundDate: '2024-01-17',
    });

    await createEvidence({
      id: 'evid_003',
      type: 'Document',
      description: 'Counterfeit currency bills',
      foundDate: '2023-09-10',
    });

    // Create relationships between evidence and cases (S3)
    await executeWriteQuery(`
      MATCH (e:Evidence {id: 'evid_001'})
      MATCH (c:Case {id: 'case_001'})
      CREATE (e)-[:FOUND_IN {location: 'Safe Room'}]->(c)
    `);

    await executeWriteQuery(`
      MATCH (e:Evidence {id: 'evid_001'})
      MATCH (s:Suspect {id: 'susp_001'})
      CREATE (e)-[:CONNECTED_TO {match_percentage: '98%'}]->(s)
    `);

    // Create relationships for evidence trail (S3)
    await executeWriteQuery(`
      MATCH (e:Evidence {id: 'evid_002'})
      MATCH (c:Case {id: 'case_001'})
      CREATE (e)-[:FOUND_IN {location: 'Crime Scene'}]->(c)
    `);

    await executeWriteQuery(`
      MATCH (e:Evidence {id: 'evid_002'})
      MATCH (s:Suspect {id: 'susp_002'})
      CREATE (e)-[:CONNECTED_TO {match_percentage: '87%'}]->(s)
    `);

    // Create Location nodes for S4
    await executeWriteQuery(`
      CREATE (l:Location {id: 'loc_001', name: 'Downtown Diamond Store', latitude: 40.7128, longitude: -74.0060, type: 'Crime Scene'})
    `);

    await executeWriteQuery(`
      CREATE (l:Location {id: 'loc_002', name: 'Port Authority', latitude: 40.7505, longitude: -73.9934, type: 'Incident Location'})
    `);

    await executeWriteQuery(`
      CREATE (l:Location {id: 'loc_003', name: 'Safe House', latitude: 40.6892, longitude: -74.0445, type: 'Surveillance'})
    `);

    // Create DateTime nodes for S4
    await executeWriteQuery(`
      CREATE (d:DateTime {id: 'dt_001', date: '2024-01-15', time: '23:45:00', timezone: 'EST'})
    `);

    await executeWriteQuery(`
      CREATE (d:DateTime {id: 'dt_002', date: '2024-02-10', time: '14:30:00', timezone: 'EST'})
    `);

    // Create timeline relationships (S4)
    await executeWriteQuery(`
      MATCH (l:Location {id: 'loc_001'})
      MATCH (c:Case {id: 'case_001'})
      CREATE (l)<-[:OCCURRED_AT {confidence: 'High'}]-(c)
    `);

    await executeWriteQuery(`
      MATCH (c:Case {id: 'case_001'})
      MATCH (d:DateTime {id: 'dt_001'})
      CREATE (c)-[:OCCURS_ON]->(d)
    `);

    await executeWriteQuery(`
      MATCH (l:Location {id: 'loc_002'})
      MATCH (c:Case {id: 'case_002'})
      CREATE (l)<-[:OCCURRED_AT {confidence: 'High'}]-(c)
    `);

    await executeWriteQuery(`
      MATCH (c:Case {id: 'case_002'})
      MATCH (d:DateTime {id: 'dt_002'})
      CREATE (c)-[:OCCURS_ON]->(d)
    `);

    // Additional cross-case relationships
    await executeWriteQuery(`
      MATCH (s:Suspect {id: 'susp_001'})
      MATCH (l:Location {id: 'loc_003'})
      CREATE (s)-[:SEEN_AT {date: '2024-01-20', time: '19:30:00'}]->(l)
    `);

    // Create kingpin network for S2 (Suspect Network)
    await createKingpinNetwork();

    // Connect kingpin network relationships
    await connectKingpinNetwork();

    // Create bidirectional communication with kingpin
    await createBidirectionalKingpinCommunication();

    return NextResponse.json(
      {
        success: true,
        message: 'Test data successfully populated',
        summary: {
          investigations: 3,
          suspects: 8,
          cases: 3,
          evidence: 3,
          locations: 3,
          datetimes: 2,
          vehicles: 1,
        },
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('Error seeding data:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  return NextResponse.json({
    message:
      'Use POST method to seed database with test data. This will clear existing data.',
  });
}
