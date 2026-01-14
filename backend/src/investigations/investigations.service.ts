import { Injectable } from '@nestjs/common';
import { Neo4jService } from 'src/neo4j/neo4j.service';
import { LoggerService } from 'src/common/logger/logger.service';
import {
  ExtendedCsvData,
  Investigation,
} from './interfaces/investigation.interface';
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

export interface IngestResult {
  suspectCount: number;
  callCount: number;
  transactionCount: number;
  cdrCount: number;
  cellTowerCount: number;
  victimCount: number;
}

@Injectable()
export class InvestigationsService {
  constructor(
    private readonly neo4jService: Neo4jService,
    private readonly logger: LoggerService,
  ) {}

  async createInvestigation(data: Investigation) {
    this.logger.log(
      `Creating investigation: ${data.name}`,
      'InvestigationsService',
    );

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

      this.logger.success(
        `Investigation created successfully: ${data.name}`,
        'InvestigationsService',
      );
      return result;
    } catch (error) {
      this.logger.failed(
        `Failed to create investigation: ${data.name}`,
        'InvestigationsService',
      );
      this.logger.error(
        error instanceof Error ? error.message : String(error),
        undefined,
        'InvestigationsService',
      );
      throw error;
    }
  }

  async ingestData(
    investigationId: string,
    data: ExtendedCsvData,
  ): Promise<IngestResult> {
    this.logger.log(
      `Starting data ingestion for investigation: ${investigationId}`,
      'InvestigationsService',
    );

    const result: IngestResult = {
      suspectCount: 0,
      callCount: 0,
      transactionCount: 0,
      cdrCount: 0,
      cellTowerCount: 0,
      victimCount: 0,
    };

    try {
      const { suspects, calls, transactions, cdrRecords, cellTowers, victims } =
        data;

      const executeWrite = (cypher: string, params: any) =>
        this.neo4jService.writeCypher(cypher, params);

      // 1. Ingest Suspects
      if (suspects && suspects.length > 0) {
        this.logger.log(
          `Ingesting ${suspects.length} suspects...`,
          'InvestigationsService',
        );

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
        result.suspectCount = suspects.length;
        this.logger.success(
          `Ingested ${suspects.length} suspects`,
          'InvestigationsService',
        );
      }

      // 2. Ingest Call Records
      if (calls && calls.length > 0) {
        this.logger.log(
          `Ingesting ${calls.length} call records...`,
          'InvestigationsService',
        );

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
        result.callCount = calls.length;
        this.logger.success(
          `Ingested ${calls.length} call records`,
          'InvestigationsService',
        );
      }

      // 3. Ingest Transactions
      if (transactions && transactions.length > 0) {
        this.logger.log(
          `Ingesting ${transactions.length} transactions...`,
          'InvestigationsService',
        );

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
        result.transactionCount = transactions.length;
        this.logger.success(
          `Ingested ${transactions.length} transactions`,
          'InvestigationsService',
        );
      }

      // 4. Ingest CDR Records with Geolocation
      if (cdrRecords && cdrRecords.length > 0) {
        this.logger.log(
          `Ingesting ${cdrRecords.length} CDR records with geolocation...`,
          'InvestigationsService',
        );

        for (const cdr of cdrRecords) {
          await executeWrite(
            `MATCH (s1:Suspect {phone: $callerPhone}),
                    (s2:Suspect {phone: $receiverPhone})
             MERGE (s1)-[r:CALLED {
               callId: $callId,
               callerTowerId: $callerTowerId,
               callerTowerLocation: $callerTowerLocation,
               callerLat: $callerLat,
               callerLon: $callerLon,
               receiverTowerId: $receiverTowerId,
               receiverTowerLocation: $receiverTowerLocation,
               receiverLat: $receiverLat,
               receiverLon: $receiverLon,
               callStartTime: $callStartTime,
               duration: $duration,
               roamingStatus: $roamingStatus,
               triangulationLat: $triLat,
               triangulationLon: $triLon,
               triangulationAccuracy: $triAccuracy,
               proximityPattern: $proximityPattern,
               signalConfidence: $signalConfidence,
               approximateDistanceKm: $distance
             }]->(s2)`,
            {
              callerPhone: cdr.caller_phone,
              receiverPhone: cdr.receiver_phone,
              callId: cdr.call_id,
              callerTowerId: cdr.caller_tower_id,
              callerTowerLocation: cdr.caller_tower_location,
              callerLat: parseFloat(String(cdr.caller_lat)) || 0,
              callerLon: parseFloat(String(cdr.caller_lon)) || 0,
              receiverTowerId: cdr.receiver_tower_id,
              receiverTowerLocation: cdr.receiver_tower_location,
              receiverLat: parseFloat(String(cdr.receiver_lat)) || 0,
              receiverLon: parseFloat(String(cdr.receiver_lon)) || 0,
              callStartTime: cdr.call_start_time,
              duration: parseInt(String(cdr.call_duration_seconds)) || 0,
              roamingStatus: cdr.roaming_status,
              triLat: parseFloat(String(cdr.triangulation_lat)) || 0,
              triLon: parseFloat(String(cdr.triangulation_lon)) || 0,
              triAccuracy:
                parseFloat(String(cdr.triangulation_accuracy_m)) || 0,
              proximityPattern: cdr.proximity_pattern,
              signalConfidence: parseFloat(String(cdr.signal_confidence)) || 0,
              distance: parseFloat(String(cdr.approximate_distance_km)) || 0,
            },
          );
        }
        result.cdrCount = cdrRecords.length;
        this.logger.success(
          `Ingested ${cdrRecords.length} CDR records`,
          'InvestigationsService',
        );
      }

      // 5. Ingest Cell Towers
      if (cellTowers && cellTowers.length > 0) {
        this.logger.log(
          `Ingesting ${cellTowers.length} cell towers...`,
          'InvestigationsService',
        );

        for (const tower of cellTowers) {
          await executeWrite(
            `MATCH (i:Investigation {id: $invId})
             CREATE (t:CellTower {
               towerId: $towerId,
               latitude: $latitude,
               longitude: $longitude,
               location: $location,
               region: $region,
               city: $city,
               coverageType: $coverageType,
               towerHeight: $towerHeight
             })
             CREATE (i)-[:HAS_TOWER]->(t)`,
            {
              invId: investigationId,
              towerId: tower.tower_id,
              latitude: parseFloat(String(tower.latitude)) || 0,
              longitude: parseFloat(String(tower.longitude)) || 0,
              location: tower.location,
              region: tower.region,
              city: tower.city,
              coverageType: tower.coverage_type,
              towerHeight: parseFloat(String(tower.tower_height_meters)) || 0,
            },
          );
        }
        result.cellTowerCount = cellTowers.length;
        this.logger.success(
          `Ingested ${cellTowers.length} cell towers`,
          'InvestigationsService',
        );
      }

      // 6. Ingest Victims
      if (victims && victims.length > 0) {
        this.logger.log(
          `Ingesting ${victims.length} victims...`,
          'InvestigationsService',
        );

        for (const victim of victims) {
          await executeWrite(
            `MATCH (i:Investigation {id: $invId})
             CREATE (v:Victim {
               victimId: $victimId,
               name: $name,
               phone: $phone,
               reportedIncident: $reportedIncident,
               callsReceived: $callsReceived,
               avgCallsDaywise: $avgCallsDaywise,
               areaOfIncident: $areaOfIncident,
               safetyStatus: $safetyStatus
             })
             CREATE (i)-[:HAS_VICTIM]->(v)`,
            {
              invId: investigationId,
              victimId: victim.victim_id,
              name: victim.name,
              phone: victim.phone,
              reportedIncident: victim.reported_incident,
              callsReceived: parseInt(String(victim.calls_received)) || 0,
              avgCallsDaywise:
                parseFloat(String(victim.avg_calls_daywise)) || 0,
              areaOfIncident: victim.area_of_incident,
              safetyStatus: victim.safety_status,
            },
          );
        }
        result.victimCount = victims.length;
        this.logger.success(
          `Ingested ${victims.length} victims`,
          'InvestigationsService',
        );
      }

      // Log final summary
      this.logger.success(
        `Data ingestion complete! Suspects: ${result.suspectCount}, Calls: ${result.callCount}, ` +
          `Transactions: ${result.transactionCount}, CDR: ${result.cdrCount}, ` +
          `Towers: ${result.cellTowerCount}, Victims: ${result.victimCount}`,
        'InvestigationsService',
      );

      return result;
    } catch (error) {
      this.logger.failed(
        `Data ingestion failed for investigation: ${investigationId}`,
        'InvestigationsService',
      );
      this.logger.error(
        error instanceof Error ? error.message : String(error),
        undefined,
        'InvestigationsService',
      );
      throw error;
    }
  }

  async runAnalysis(investigationId: string) {
    this.logger.log(
      `Starting analysis for investigation: ${investigationId}`,
      'InvestigationsService',
    );

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
          if (rel && target) {
            const edgeType = rel.type;
            const properties = rel.properties;
            edges.push({
              source: sourceId,
              target: target.properties.id as string,
              type: edgeType,
              ...properties,
            });
          }
        });
      });

      this.logger.success(
        `Analysis complete! Found ${nodes.length} nodes and ${edges.length} edges`,
        'InvestigationsService',
      );

      return { nodes: nodes, edges: edges };
    } catch (error) {
      this.logger.failed(
        `Analysis failed for investigation: ${investigationId}`,
        'InvestigationsService',
      );
      this.logger.error(
        error instanceof Error ? error.message : String(error),
        undefined,
        'InvestigationsService',
      );
      throw error;
    }
  }
}
