import { executeQuery, executeWriteQuery } from './client';

// Graph S1: Investigation Network - Shows relationships between investigations
export const getS1InvestigationNetwork = async () => {
  const query = `
    MATCH (i1:Investigation)-[r:RELATED_TO]->(i2:Investigation)
    RETURN i1, r, i2
    LIMIT 100
  `;
  return executeQuery(query);
};

// Graph S2: Suspect-Case Connections - Shows suspects linked to cases
export const getS2SuspectNetwork = async () => {
  const query = `
    MATCH (s:Suspect)-[r:INVOLVED_IN]->(c:Case)
    OPTIONAL MATCH (c)-[r2:INVOLVES]->(v:Vehicle)
    RETURN s, r, c, r2, v
    LIMIT 100
  `;
  return executeQuery(query);
};

// Graph S3: Evidence Trail - Shows evidence connections across cases
export const getS3EvidenceTrail = async () => {
  const query = `
    MATCH (e:Evidence)-[r:FOUND_IN]->(c:Case)
    OPTIONAL MATCH (e)-[r2:CONNECTED_TO]->(s:Suspect)
    RETURN e, r, c, r2, s
    LIMIT 100
  `;
  return executeQuery(query);
};

// Graph S4: Timeline/Location Network - Shows geographic and temporal relationships
export const getS4TimelineNetwork = async () => {
  const query = `
    MATCH (l:Location)<-[r:OCCURRED_AT]-(c:Case)
    OPTIONAL MATCH (c)-[r2:OCCURS_ON]->(d:DateTime)
    RETURN l, r, c, r2, d
    LIMIT 100
  `;
  return executeQuery(query);
};

// Create investigation nodes
export const createInvestigation = async (data: {
  id: string;
  name: string;
  status: string;
  startDate: string;
}) => {
  const query = `
    CREATE (i:Investigation {
      id: $id,
      name: $name,
      status: $status,
      startDate: $startDate
    })
    RETURN i
  `;
  return executeWriteQuery(query, data);
};

// Create suspect node
export const createSuspect = async (data: {
  id: string;
  name: string;
  status: string;
  riskLevel: string;
}) => {
  const query = `
    CREATE (s:Suspect {
      id: $id,
      name: $name,
      status: $status,
      riskLevel: $riskLevel
    })
    RETURN s
  `;
  return executeWriteQuery(query, data);
};

// Create evidence node
export const createEvidence = async (data: {
  id: string;
  type: string;
  description: string;
  foundDate: string;
}) => {
  const query = `
    CREATE (e:Evidence {
      id: $id,
      type: $type,
      description: $description,
      foundDate: $foundDate
    })
    RETURN e
  `;
  return executeWriteQuery(query, data);
};

// Create case node
export const createCase = async (data: {
  id: string;
  title: string;
  status: string;
  priority: string;
}) => {
  const query = `
    CREATE (c:Case {
      id: $id,
      title: $title,
      status: $status,
      priority: $priority
    })
    RETURN c
  `;
  return executeWriteQuery(query, data);
};

// Create relationships
export const createRelationship = async (data: {
  fromType: string;
  fromId: string;
  toType: string;
  toId: string;
  relationshipType: string;
}) => {
  const query = `
    MATCH (from:${data.fromType} {id: $fromId})
    MATCH (to:${data.toType} {id: $toId})
    CREATE (from)-[r:${data.relationshipType}]->(to)
    RETURN r
  `;
  return executeWriteQuery(query, {
    fromId: data.fromId,
    toId: data.toId,
  });
};

// Get all investigations
export const getAllInvestigations = async () => {
  const query = `
    MATCH (i:Investigation)
    RETURN i
    ORDER BY i.startDate DESC
  `;
  return executeQuery(query);
};

// Get all suspects
export const getAllSuspects = async () => {
  const query = `
    MATCH (s:Suspect)
    RETURN s
    ORDER BY s.riskLevel DESC
  `;
  return executeQuery(query);
};

// Get all cases
export const getAllCases = async () => {
  const query = `
    MATCH (c:Case)
    RETURN c
    ORDER BY c.priority DESC
  `;
  return executeQuery(query);
};

// Get case details with related data
export const getCaseDetails = async (caseId: string) => {
  const query = `
    MATCH (c:Case {id: $caseId})
    OPTIONAL MATCH (c)-[:INVOLVES]->(s:Suspect)
    OPTIONAL MATCH (c)-[:HAS_EVIDENCE]->(e:Evidence)
    OPTIONAL MATCH (c)-[:OCCURRED_AT]->(l:Location)
    RETURN {
      case: c,
      suspects: collect(s),
      evidence: collect(e),
      locations: collect(l)
    }
  `;
  return executeQuery(query, { caseId });
};

// Create kingpin suspects network
export const createKingpinNetwork = async () => {
  const query = `
    CREATE
      (s4:Suspect {
        id: "S4",
        role: "Kingpin",
        risk: "Critical",
        color: "red"
      }),
      (s1:Suspect {
        id: "S1",
        role: "Coordinator",
        risk: "High",
        color: "orange"
      }),
      (s2:Suspect {
        id: "S2",
        role: "Coordinator",
        risk: "High",
        color: "orange"
      }),
      (s3:Suspect {
        id: "S3",
        role: "Coordinator",
        risk: "High",
        color: "orange"
      }),
      (s5:Suspect {
        id: "S5",
        role: "Mule",
        risk: "Low",
        color: "green"
      })
    RETURN s4, s1, s2, s3, s5
  `;
  return executeWriteQuery(query);
};

// Create relationships between kingpin suspects
export const connectKingpinNetwork = async () => {
  // Kingpin (S4) commands coordinators (S1, S2, S3)
  await executeWriteQuery(`
    MATCH (s4:Suspect {id: "S4"})
    MATCH (s1:Suspect {id: "S1"})
    CREATE (s4)-[:COMMANDS {since: '2023-01-01', authority: 'High'}]->(s1)
  `);

  await executeWriteQuery(`
    MATCH (s4:Suspect {id: "S4"})
    MATCH (s2:Suspect {id: "S2"})
    CREATE (s4)-[:COMMANDS {since: '2023-01-15', authority: 'High'}]->(s2)
  `);

  await executeWriteQuery(`
    MATCH (s4:Suspect {id: "S4"})
    MATCH (s3:Suspect {id: "S3"})
    CREATE (s4)-[:COMMANDS {since: '2023-02-01', authority: 'High'}]->(s3)
  `);

  // Coordinators communicate with each other
  await executeWriteQuery(`
    MATCH (s1:Suspect {id: "S1"})
    MATCH (s2:Suspect {id: "S2"})
    CREATE (s1)-[:COMMUNICATES_WITH {frequency: 'Daily'}]->(s2)
  `);

  await executeWriteQuery(`
    MATCH (s2:Suspect {id: "S2"})
    MATCH (s3:Suspect {id: "S3"})
    CREATE (s2)-[:COMMUNICATES_WITH {frequency: 'Daily'}]->(s3)
  `);

  // Coordinators command the mule (S5)
  await executeWriteQuery(`
    MATCH (s1:Suspect {id: "S1"})
    MATCH (s5:Suspect {id: "S5"})
    CREATE (s1)-[:DIRECTS {role: 'Mule Handler', since: '2024-01-01'}]->(s5)
  `);

  await executeWriteQuery(`
    MATCH (s2:Suspect {id: "S2"})
    MATCH (s5:Suspect {id: "S5"})
    CREATE (s2)-[:DIRECTS {role: 'Mule Handler', since: '2024-01-01'}]->(s5)
  `);

  return { success: true, message: 'Kingpin network relationships created' };
};

// Create bidirectional communication with kingpin
export const createBidirectionalKingpinCommunication = async () => {
  const query = `
    MATCH
      (s1:Suspect {id:"S1"}),
      (s2:Suspect {id:"S2"}),
      (s3:Suspect {id:"S3"}),
      (s5:Suspect {id:"S5"}),
      (s4:Suspect {id:"S4"})
    CREATE
      (s1)-[:COMMUNICATES_WITH {frequency:"High"}]->(s4),
      (s2)-[:COMMUNICATES_WITH {frequency:"High"}]->(s4),
      (s3)-[:COMMUNICATES_WITH {frequency:"High"}]->(s4),
      (s5)-[:COMMUNICATES_WITH {frequency:"Low"}]->(s4)
    RETURN s1, s2, s3, s4, s5
  `;
  return executeWriteQuery(query);
};

// Graph S5: Criminal Network - Interactive network of all suspects and their connections
export const getCriminalNetwork = async () => {
  const query = `
    MATCH (s:Suspect)
    OPTIONAL MATCH (s)-[r:COMMANDS]->(target)
    OPTIONAL MATCH (s)-[r2:COMMUNICATES_WITH]->(target2)
    OPTIONAL MATCH (s)-[r3:DIRECTS]->(target3)
    RETURN DISTINCT s, r, target, r2, target2, r3, target3
  `;
  return executeQuery(query);
};
