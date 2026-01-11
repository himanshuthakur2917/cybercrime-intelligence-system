import { getCriminalNetwork } from '@/lib/neo4j/queries';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const data = await getCriminalNetwork();
    
    // Transform Neo4j data into graph format
    const nodes: any[] = [];
    const edges: any[] = [];
    const nodeMap = new Map();

    // Process all suspect nodes
    if (data && Array.isArray(data)) {
      data.forEach((record: any) => {
        // Add main suspect node
        if (record.s) {
          const suspect = record.s;
          if (!nodeMap.has(suspect.id)) {
            nodeMap.set(suspect.id, true);
            nodes.push({
              id: suspect.id,
              label: suspect.id,
              title: `${suspect.id} - ${suspect.role}`,
              color: suspect.color || '#1E88E5',
              value: suspect.risk === 'Critical' ? 40 : suspect.risk === 'High' ? 30 : 20,
              role: suspect.role,
              risk: suspect.risk,
              properties: suspect
            });
          }
        }

        // Add target nodes from COMMANDS relationship
        if (record.target) {
          const target = record.target;
          if (!nodeMap.has(target.id)) {
            nodeMap.set(target.id, true);
            nodes.push({
              id: target.id,
              label: target.id,
              title: `${target.id} - ${target.role}`,
              color: target.color || '#1E88E5',
              value: target.risk === 'Critical' ? 40 : target.risk === 'High' ? 30 : 20,
              role: target.role,
              risk: target.risk,
              properties: target
            });
          }
          
          if (record.r) {
            edges.push({
              from: record.s.id,
              to: target.id,
              label: 'COMMANDS',
              color: { color: '#FF6B6B' },
              arrows: 'to',
              relationship: record.r
            });
          }
        }

        // Add target nodes from COMMUNICATES_WITH relationship
        if (record.target2) {
          const target2 = record.target2;
          if (!nodeMap.has(target2.id)) {
            nodeMap.set(target2.id, true);
            nodes.push({
              id: target2.id,
              label: target2.id,
              title: `${target2.id} - ${target2.role}`,
              color: target2.color || '#1E88E5',
              value: target2.risk === 'Critical' ? 40 : target2.risk === 'High' ? 30 : 20,
              role: target2.role,
              risk: target2.risk,
              properties: target2
            });
          }

          if (record.r2) {
            edges.push({
              from: record.s.id,
              to: target2.id,
              label: 'COMMUNICATES',
              color: { color: '#4ECDC4' },
              arrows: 'to',
              relationship: record.r2
            });
          }
        }

        // Add target nodes from DIRECTS relationship
        if (record.target3) {
          const target3 = record.target3;
          if (!nodeMap.has(target3.id)) {
            nodeMap.set(target3.id, true);
            nodes.push({
              id: target3.id,
              label: target3.id,
              title: `${target3.id} - ${target3.role}`,
              color: target3.color || '#1E88E5',
              value: target3.risk === 'Critical' ? 40 : target3.risk === 'High' ? 30 : 20,
              role: target3.role,
              risk: target3.risk,
              properties: target3
            });
          }

          if (record.r3) {
            edges.push({
              from: record.s.id,
              to: target3.id,
              label: 'DIRECTS',
              color: { color: '#95E1D3' },
              arrows: 'to',
              relationship: record.r3
            });
          }
        }
      });
    }

    return NextResponse.json({ 
      success: true, 
      data: {
        nodes,
        edges,
        rawData: data
      }
    });
  } catch (error: any) {
    console.error('Error fetching criminal network:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
