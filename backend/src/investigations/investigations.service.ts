import { Injectable } from '@nestjs/common';
import { Neo4jService } from 'src/neo4j/neo4j.service';
import { csvData, Investigation } from './interfaces/investigation.interface';
import { Record, Node, Relationship } from 'neo4j-driver';

export interface GraphNode {
  id: string;
  label: string;
  phone: string;
}

export interface GraphEdge {
  source: string;
  target: string;
  type: string;
  [key: string]: any;
}

@Injectable()
export class InvestigationsService {
  constructor(private readonly neo4jService: Neo4jService) {}

  async createInvestigation(data: Investigation) {
    try {
      const result = await this.neo4jService.writeCypher(
        `CREATE (i:Investigation {
          id: $id,
          name: $name,
          caseId: $caseId,
          createdBy: $createdBy,
          createdAt: datetime(),
          status: 'CREATED'
        }) RETURN i`,
        {
          id: `inv_${Date.now()}`,
          name: data.name,
          caseId: data.caseId,
          createdBy: data.createdBy,
        },
      );
      // return result.records[0].get('i').properties;
      return result;
    } catch (error) {
      console.error('Error creating investigation:', error);
      throw error;
    }
  }

  async ingestData(investigationId: string, data: csvData) {
    try {
      const { suspects, calls, transactions } = data;

      const executeWrite = (cypher: string, params: any) =>
        this.neo4jService.writeCypher(cypher, params);

      for (const suspect of suspects) {
        await executeWrite(
          `MATCH (i:Investigation {id: $invId})
           CREATE (s:Suspect {
             id: $suspectId,
             name: $name,
             phone: $phone,
             account: $account,
             firId: $firId,
             status: $status
           })
           CREATE (i)-[:CONTAINS]->(s)`,
          {
            invId: investigationId,
            suspectId: suspect.suspect_id,
            name: suspect.name,
            phone: suspect.phone,
            account: suspect.account || null,
            firId: suspect.fir_id,
            status: suspect.status,
          },
        );
      }

      for (const call of calls) {
        await executeWrite(
          `MATCH (s1:Suspect {phone: $from}),
                  (s2:Suspect {phone: $to})
           MERGE (s1)-[r:CALLED {
             callCount: $count,
             duration: $duration
           }]->(s2)`,
          {
            from: call.caller_phone,
            to: call.receiver_phone,
            count: call.call_count,
            duration: call.total_duration,
          },
        );
      }

      for (const transaction of transactions) {
        await executeWrite(
          `MATCH (s1:Suspect {account: $from}),
                  (s2:Suspect {account: $to})
           CREATE (s1)-[r:TRANSACTION {
             amount: $amount,
             date: $date
           }]->(s2)`,
          {
            from: transaction.from_account,
            to: transaction.to_account,
            amount: transaction.amount,
            date: transaction.date,
          },
        );
      }

      return {
        suspectCount: suspects.length,
        callCount: calls.length,
        transactionCount: transactions.length,
      };
    } catch (error) {
      console.error('Error ingesting data:', error);
      throw error;
    }
  }

  async runAnalysis(investigationId: string) {
    const executeRead = (cypher: string, params: any) =>
      this.neo4jService.readCypher(cypher, params);
    try {
      // fetch graph data
      const graphResult: Record[] = await executeRead(
        `MATCH (i:Investigation {id: $invId})-[:CONTAINS]->(s:Suspect)
         OPTIONAL MATCH (s)-[r:CALLED|TRANSACTION]->(t:Suspect)
         RETURN s, collect({rel: r, target: t}) as edges`,
        { invId: investigationId },
      );

      // Build Graph Structure
      const nodes: GraphNode[] = graphResult.map((r) => {
        const s = r.get('s') as Node;
        return {
          id: s.properties.id as string,
          label: s.properties.name as string,
          phone: s.properties.phone as string,
        };
      });

      // Build edges
      const edges: GraphEdge[] = [];
      graphResult.forEach((r) => {
        const s = r.get('s') as Node;
        const sourceId = s.properties.id as string;

        const edgeList = r.get('edges') as Array<{
          rel: Relationship;
          target: Node;
        }>;
        edgeList.forEach(({ rel, target }) => {
          const edgeType = rel.type;
          const properties = rel.properties;
          edges.push({
            source: sourceId,
            target: target.properties.id as string,
            type: edgeType,
            ...properties,
          });
        });
      });

      // add ml service for advanced analysis

      // add ai generated briefings section

      return { nodes: nodes, edges: edges };
    } catch (error) {
      console.error('Error running analysis:', error);
      throw error;
    }
  }
}
