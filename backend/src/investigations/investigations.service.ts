import { Injectable } from '@nestjs/common';
import { Neo4jService } from 'src/neo4j/neo4j.service';
import { LoggerService } from 'src/common/logger/logger.service';
import { SupabaseService } from 'src/supabase/supabase.service';
import {
  ExtendedCsvData,
  Investigation,
  Suspects,
} from './interfaces/investigation.interface';
import { Record, Node, Relationship, Integer } from 'neo4j-driver';

export interface GraphNode {
  id: string;
  label: string;
  phone: string;
  riskScore?: number;
  networkRole?: string;
  status?: string;
  lastKnownLocation?: string;
  trajectoryHistory?: string;
}

export interface GraphEdge {
  source: string;
  target: string;
  type: string;
  [key: string]: any;
}

export interface CallPattern {
  callerId: string;
  callerName: string;
  callerPhone: string;
  receiverId: string;
  receiverName: string;
  receiverPhone: string;
  callCount: number;
  totalDuration: number;
  towers: {
    id: string;
    name: string;
    lat: number;
    lon: number;
  }[];
  riskLevel: string;
}

export interface IngestResult {
  suspectCount: number;
  callCount: number;
  transactionCount: number;
  cdrCount: number;
  cellTowerCount: number;
  victimCount: number;
}

/**
 * Helper to recursively convert all Neo4j Integers in an object to regular JS numbers
 */
function convertNeo4jIntegers(obj: any): any {
  if (obj === null || obj === undefined) return obj;
  if (Integer.isInteger(obj)) return obj.toNumber();
  if (typeof obj === 'object' && 'low' in obj && 'high' in obj) {
    return Integer.fromValue(obj).toNumber();
  }
  if (Array.isArray(obj)) {
    return obj.map(convertNeo4jIntegers);
  }
  if (typeof obj === 'object') {
    const result: any = {};
    for (const key in obj) {
      result[key] = convertNeo4jIntegers(obj[key]);
    }
    return result;
  }
  return obj;
}

@Injectable()
export class InvestigationsService {
  // Batch size for processing large datasets
  private readonly BATCH_SIZE = 1000;

  constructor(
    private readonly neo4jService: Neo4jService,
    private readonly supabaseService: SupabaseService,
    private readonly logger: LoggerService,
  ) {}

  /**
   * Initialize database constraints and indexes
   * Call this once on application startup
   */
  async initializeDatabase() {
    this.logger.log(
      'Initializing database constraints and indexes',
      'InvestigationsService',
    );

    const constraints = [
      // Unique constraints
      'CREATE CONSTRAINT investigation_id IF NOT EXISTS FOR (i:Investigation) REQUIRE i.id IS UNIQUE',
      'CREATE CONSTRAINT suspect_id IF NOT EXISTS FOR (s:Suspect) REQUIRE s.id IS UNIQUE',
      'CREATE CONSTRAINT celltower_id IF NOT EXISTS FOR (t:CellTower) REQUIRE t.towerId IS UNIQUE',
      'CREATE CONSTRAINT victim_id IF NOT EXISTS FOR (v:Victim) REQUIRE v.victimId IS UNIQUE',

      // Indexes for frequent lookups
      'CREATE INDEX suspect_phone IF NOT EXISTS FOR (s:Suspect) ON (s.phone)',
      'CREATE INDEX suspect_account IF NOT EXISTS FOR (s:Suspect) ON (s.account)',
      'CREATE INDEX investigation_status IF NOT EXISTS FOR (i:Investigation) ON (i.status)',
      'CREATE INDEX victim_phone IF NOT EXISTS FOR (v:Victim) ON (v.phone)',
      'CREATE INDEX suspect_risk_score IF NOT EXISTS FOR (s:Suspect) ON (s.riskScore)',
      'CREATE INDEX suspect_network_role IF NOT EXISTS FOR (s:Suspect) ON (s.networkRole)',
      'CREATE INDEX transaction_suspicious_score IF NOT EXISTS FOR ()-[t:TRANSACTION]-() ON (t.suspiciousScore)',
      'CREATE INDEX call_prosecution_grade IF NOT EXISTS FOR ()-[c:CALLED]-() ON (c.prosecutionGrade)',
    ];

    for (const constraint of constraints) {
      try {
        await this.neo4jService.writeCypher(constraint, {});
      } catch (error) {
        this.logger.log(
          `Constraint/Index already exists or failed: ${error}`,
          'InvestigationsService',
        );
      }
    }

    this.logger.success(
      'Database initialization complete',
      'InvestigationsService',
    );
  }

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

  async listInvestigations() {
    this.logger.log('Fetching all investigations', 'InvestigationsService');
    try {
      const records = await this.neo4jService.readCypher(
        `MATCH (i:Investigation) 
         RETURN i.id as id, i.name as name, i.status as status 
         ORDER BY i.createdAt DESC`,
        {},
      );
      return records.map((r) => ({
        id: r.get('id'),
        name: r.get('name'),
        status: r.get('status'),
      }));
    } catch (error) {
      this.logger.error(
        'Failed to list investigations',
        'InvestigationsService',
      );
      return [];
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

      // 0. Optimized cleanup - single query
      this.logger.log(
        `Cleaning up existing data for investigation: ${investigationId}`,
        'InvestigationsService',
      );
      await this.neo4jService.writeCypher(
        `MATCH (i:Investigation {id: $invId})
         OPTIONAL MATCH (i)-[:CONTAINS]->(s:Suspect)
         OPTIONAL MATCH (i)-[:HAS_TOWER]->(t:CellTower)
         OPTIONAL MATCH (i)-[:HAS_VICTIM]->(v:Victim)
         DETACH DELETE s, t, v, i`,
        { invId: investigationId },
      );
      this.logger.success(
        `Cleanup complete for ${investigationId}`,
        'InvestigationsService',
      );

      // 1. Batch Ingest Suspects with Enhanced Fields
      if (suspects && suspects.length > 0) {
        this.logger.log(
          `Ingesting ${suspects.length} suspects in batches...`,
          'InvestigationsService',
        );

        await this.batchProcess(suspects, async (batch) => {
          await this.neo4jService.writeCypher(
            `MERGE (i:Investigation {id: $invId})
             ON CREATE SET i.name = 'Default Investigation', 
                          i.caseId = 'default', 
                          i.createdAt = datetime(), 
                          i.status = 'ACTIVE'
             WITH i
             UNWIND $suspects AS suspect
             CREATE (s:Suspect {
               id: suspect.suspectId,
               name: suspect.name,
               phone: suspect.phone,
               alternatePhone: suspect.alternatePhone,
               account: suspect.account,
               bankName: suspect.bankName,
               firId: suspect.firId,
               status: suspect.status,
               aliasNames: suspect.aliasNames,
               riskScore: suspect.riskScore,
               knownAssociates: suspect.knownAssociates,
               lastKnownLocation: suspect.lastKnownLocation,
               aadharHash: suspect.aadharHash,
               panHash: suspect.panHash,
               deviceImei: suspect.deviceImei,
               networkRole: suspect.networkRole,
               devicePhones: suspect.devicePhones,
               networkHierarchyLevel: suspect.networkHierarchyLevel,
               estimatedAssets: suspect.estimatedAssets,
               teamSize: suspect.teamSize,
               operationalCapability: suspect.operationalCapability,
               arrestWarrantIssued: suspect.arrestWarrantIssued,
               trajectoryHistory: suspect.trajectoryHistory
             })
             CREATE (i)-[:CONTAINS]->(s)`,
            {
              invId: investigationId,
              suspects: batch.map((s: any) => ({
                suspectId: s.suspect_id || s.id || `suspect_${s.phone}`,
                name: s.name || `Unknown (${s.phone})`,
                phone: String(s.phone),
                alternatePhone: s.alternate_phone || s.alt_phones || null,
                allPhones: [
                  String(s.phone),
                  ...(s.alternate_phone || s.alt_phones || '')
                    .split('|')
                    .filter((p: string) => p.trim().length > 0),
                ],
                account: s.account || null,
                bankName: s.bank_name || null,
                firId: s.fir_id || s.fir_number || 'default',
                status: s.status || 'ACTIVE',
                aliasNames: s.alias_names || s.alias || null,
                riskScore:
                  parseFloat(String(s.risk_score || 0)) ||
                  (s.risk === 'CRITICAL'
                    ? 90
                    : s.risk === 'HIGH'
                      ? 70
                      : s.risk === 'MEDIUM'
                        ? 50
                        : 20),
                knownAssociates: s.known_associates || null,
                lastKnownLocation: s.last_known_location || null,
                trajectoryHistory: s.trajectory_history || null,
                aadharHash: s.aadhar_hash || null,
                panHash: s.pan_hash || null,
                deviceImei: s.device_imei || null,
                networkRole: s.network_role || 'UNKNOWN',
                devicePhones: s.device_phones || null,
                networkHierarchyLevel: parseInt(
                  String(s.network_hierarchy_level || 1),
                ),
                estimatedAssets: s.estimated_assets || null,
                teamSize: parseInt(String(s.team_size || 0)),
                operationalCapability: s.operational_capability || null,
                arrestWarrantIssued: s.arrest_warrant_issued || 'NO',
              })),
            },
          );
        });

        result.suspectCount = suspects.length;
        this.logger.success(
          `Ingested ${suspects.length} suspects`,
          'InvestigationsService',
        );
      }

      // 2. Batch Ingest Call Records with Enhanced Fields
      if (calls && calls.length > 0) {
        this.logger.log(
          `Ingesting ${calls.length} call records in batches...`,
          'InvestigationsService',
        );

        await this.batchProcess(calls, async (batch) => {
          await this.neo4jService.writeCypher(
            `MATCH (i:Investigation {id: $invId})
             WITH i
             UNWIND $calls AS call
             MERGE (s1:Suspect {phone: call.from})
             ON CREATE SET s1.id = 'suspect_' + call.from, 
                          s1.name = 'Unknown (' + call.from + ')', 
                          s1.status = 'UNKNOWN'
             MERGE (i)-[:CONTAINS]->(s1)
             WITH i, call, s1
             MERGE (s2:Suspect {phone: call.to})
             ON CREATE SET s2.id = 'suspect_' + call.to, 
                          s2.name = 'Unknown (' + call.to + ')', 
                          s2.status = 'UNKNOWN'
             MERGE (i)-[:CONTAINS]->(s2)
             WITH call, s1, s2
             MERGE (s1)-[r:CALLED]->(s2)
             ON CREATE SET 
               r.callCount = call.count, 
               r.duration = call.duration,
               r.callDate = call.callDate,
               r.firstCallTime = call.firstCallTime,
               r.lastCallTime = call.lastCallTime,
               r.avgCallDuration = call.avgCallDuration,
               r.maxCallDuration = call.maxCallDuration,
               r.minCallDuration = call.minCallDuration,
               r.callPattern = call.callPattern,
               r.proximityPattern = call.proximityPattern,
               r.matchedSuspectId = call.matchedSuspectId,
               r.matchedVictimId = call.matchedVictimId,
               r.callsPerDay = call.callsPerDay,
               r.timeSynchronizedTxn = call.timeSynchronizedTxn,
               r.matchingTxnDate = call.matchingTxnDate,
               r.matchingTxnAmount = call.matchingTxnAmount,
               r.prosecutionGrade = call.prosecutionGrade
             ON MATCH SET 
               r.callCount = COALESCE(r.callCount, 0) + call.count, 
               r.duration = COALESCE(r.duration, 0) + call.duration`,
            {
              invId: investigationId,
              calls: batch.map((c) => ({
                from: String(c.caller_phone),
                to: String(c.receiver_phone),
                count: parseInt(String(c.call_count)) || 1,
                duration: parseInt(String(c.total_duration)) || 0,
                callDate: c.call_date || null,
                firstCallTime: c.first_call_time || null,
                lastCallTime: c.last_call_time || null,
                avgCallDuration: parseInt(String(c.avg_call_duration)) || 0,
                maxCallDuration: parseInt(String(c.max_call_duration)) || 0,
                minCallDuration: parseInt(String(c.min_call_duration)) || 0,
                callPattern: c.call_pattern || 'UNKNOWN',
                proximityPattern: c.proximity_pattern || null,
                matchedSuspectId: c.matched_suspect_id || null,
                matchedVictimId: c.matched_victim_id || null,
                callsPerDay: parseFloat(String(c.calls_per_day)) || 0,
                timeSynchronizedTxn:
                  c.time_synchronized_txn === true ||
                  c.time_synchronized_txn === 'true',
                matchingTxnDate: c.matching_txn_date || null,
                matchingTxnAmount: c.matching_txn_amount || null,
                prosecutionGrade: c.prosecution_grade || 'NONE',
              })),
            },
          );
        });

        result.callCount = calls.length;
        this.logger.success(
          `Ingested ${calls.length} call records`,
          'InvestigationsService',
        );
      }

      // 3. Batch Ingest Transactions with Enhanced Fields
      if (transactions && transactions.length > 0) {
        this.logger.log(
          `Ingesting ${transactions.length} transactions in batches...`,
          'InvestigationsService',
        );

        await this.batchProcess(transactions, async (batch) => {
          await this.neo4jService.writeCypher(
            `UNWIND $transactions AS tx
             MATCH (s1:Suspect {account: tx.from})
             MATCH (s2:Suspect {account: tx.to})
             CREATE (s1)-[r:TRANSACTION {
               amount: tx.amount,
               date: tx.date,
               time: tx.time,
               purpose: tx.purpose,
               transactionType: tx.transactionType,
               bankRef: tx.bankRef,
               status: tx.status,
               suspiciousScore: tx.suspiciousScore,
               linkedFir: tx.linkedFir,
               notes: tx.notes,
               sourceSuspectId: tx.sourceSuspectId,
               actualPurpose: tx.actualPurpose,
               moneyLaunderingLayer: tx.moneyLaunderingLayer,
               destinationType: tx.destinationType,
               isMuleAccount: tx.isMuleAccount,
               timeSyncCallId: tx.timeSyncCallId,
               matchedVictimId: tx.matchedVictimId,
               prosecutionEvidenceGrade: tx.prosecutionEvidenceGrade
             }]->(s2)`,
            {
              transactions: batch.map((t) => ({
                from: t.from_account,
                to: t.to_account,
                amount: parseInt(String(t.amount)) || 0,
                date: t.date,
                time: t.time || null,
                purpose: t.purpose || null,
                transactionType: t.transaction_type || 'UNKNOWN',
                bankRef: t.bank_ref || null,
                status: t.status || 'COMPLETED',
                suspiciousScore: parseFloat(String(t.suspicious_score)) || 0,
                linkedFir: t.linked_fir || null,
                notes: t.notes || null,
                sourceSuspectId: t.source_suspect_id || null,
                actualPurpose: t.actual_purpose || null,
                moneyLaunderingLayer:
                  parseInt(String(t.money_laundering_layer)) || 0,
                destinationType: t.destination_type || null,
                isMuleAccount: t.is_mule_account || 'NO',
                timeSyncCallId: t.time_sync_call_id || null,
                matchedVictimId: t.matched_victim_id || null,
                prosecutionEvidenceGrade:
                  t.prosecution_evidence_grade || 'NONE',
              })),
            },
          );
        });

        result.transactionCount = transactions.length;
        this.logger.success(
          `Ingested ${transactions.length} transactions`,
          'InvestigationsService',
        );
      }

      // 4. Batch Ingest CDR Records with Enhanced Fields
      if (cdrRecords && cdrRecords.length > 0) {
        this.logger.log(
          `Ingesting ${cdrRecords.length} CDR records in batches...`,
          'InvestigationsService',
        );

        await this.batchProcess(cdrRecords, async (batch) => {
          await this.neo4jService.writeCypher(
            `MATCH (i:Investigation {id: $invId})
             WITH i
             UNWIND $cdrRecords AS cdr
             
             // Find existing suspect by checking if caller phone is in their allPhones array
             OPTIONAL MATCH (existing_s1:Suspect)
             WHERE (i)-[:CONTAINS]->(existing_s1) 
               AND cdr.callerPhone IN existing_s1.allPhones
             
             // If not found, create unknown suspect
             WITH i, cdr, existing_s1
             CALL {
               WITH i, cdr, existing_s1
               WITH i, cdr, existing_s1
               WHERE existing_s1 IS NULL
               MERGE (unknown_s1:Suspect {phone: cdr.callerPhone})
               ON CREATE SET unknown_s1.id = 'suspect_' + cdr.callerPhone,
                            unknown_s1.name = 'Unknown (' + cdr.callerPhone + ')',
                            unknown_s1.status = 'UNKNOWN',
                            unknown_s1.allPhones = [cdr.callerPhone]
               MERGE (i)-[:CONTAINS]->(unknown_s1)
               RETURN unknown_s1 AS s1_final
               UNION
               WITH existing_s1
               WHERE existing_s1 IS NOT NULL
               RETURN existing_s1 AS s1_final
             }
             
             // Find existing suspect for receiver by checking allPhones array
             WITH i, cdr, s1_final
             OPTIONAL MATCH (existing_s2:Suspect)
             WHERE (i)-[:CONTAINS]->(existing_s2)
               AND cdr.receiverPhone IN existing_s2.allPhones
             
             // If not found, create unknown suspect
             WITH i, cdr, s1_final, existing_s2
             CALL {
               WITH i, cdr, existing_s2
               WITH i, cdr, existing_s2
               WHERE existing_s2 IS NULL
               MERGE (unknown_s2:Suspect {phone: cdr.receiverPhone})
               ON CREATE SET unknown_s2.id = 'suspect_' + cdr.receiverPhone,
                            unknown_s2.name = 'Unknown (' + cdr.receiverPhone + ')',
                            unknown_s2.status = 'UNKNOWN',
                            unknown_s2.allPhones = [cdr.receiverPhone]
               MERGE (i)-[:CONTAINS]->(unknown_s2)
               RETURN unknown_s2 AS s2_final
               UNION
               WITH existing_s2
               WHERE existing_s2 IS NOT NULL
               RETURN existing_s2 AS s2_final
             }
             
             // Create CDR_CALL relationship
             WITH cdr, s1_final, s2_final
             CREATE (s1_final)-[r:CDR_CALL {
               callId: cdr.callId,
               callerTowerId: cdr.callerTowerId,
               receiverTowerId: cdr.receiverTowerId,
               callStartTime: cdr.callStartTime,
               duration: cdr.duration,
               proximityPattern: cdr.proximityPattern,
               approximateDistanceKm: cdr.distance,
               matchedSuspectId: cdr.matchedSuspectId,
               matchedVictimId: cdr.matchedVictimId,
               matchedTransactionId: cdr.matchedTransactionId,
               suspectMovementSequenceNumber: cdr.suspectMovementSequenceNumber,
               prosecutionReadiness: cdr.prosecutionReadiness
             }]->(s2_final)`,
            {
              invId: investigationId,
              cdrRecords: batch.map((cdr: any) => ({
                callerPhone:
                  cdr.caller_phone ||
                  cdr.callerPhone ||
                  String(cdr.caller_phone) ||
                  '',
                receiverPhone:
                  cdr.receiver_phone ||
                  cdr.receiverPhone ||
                  cdr.callee_phone ||
                  String(cdr.callee_phone) ||
                  '',
                callId:
                  cdr.call_id ||
                  cdr.callId ||
                  cdr.txn_id ||
                  `call_${Date.now()}_${Math.random()}`,
                callerTowerId:
                  cdr.caller_tower_id ||
                  cdr.cell_tower_id ||
                  cdr.tower_id ||
                  null,
                receiverTowerId: cdr.receiver_tower_id || null,
                callStartTime:
                  cdr.call_start_time ||
                  cdr.timestamp ||
                  cdr.date ||
                  new Date().toISOString(),
                duration: parseInt(
                  String(
                    cdr.call_duration_seconds ||
                      cdr.duration_sec ||
                      cdr.duration ||
                      0,
                  ),
                ),
                proximityPattern: cdr.proximity_pattern || 'UNKNOWN',
                distance: parseFloat(
                  String(cdr.approximate_distance_km || cdr.distance || 0),
                ),
                matchedSuspectId: cdr.matched_suspect_id || null,
                matchedVictimId: cdr.matched_victim_id || null,
                matchedTransactionId: cdr.matched_transaction_id || null,
                suspectMovementSequenceNumber: parseInt(
                  String(cdr.suspect_movement_sequence_number || 0),
                ),
                prosecutionReadiness: cdr.prosecution_readiness || 'NOT_READY',
              })),
            },
          );
        });

        result.cdrCount = cdrRecords.length;
        this.logger.success(
          `Ingested ${cdrRecords.length} CDR records`,
          'InvestigationsService',
        );
      }

      // 5. Batch Ingest Cell Towers with Enhanced Fields
      if (cellTowers && cellTowers.length > 0) {
        this.logger.log(
          `Ingesting ${cellTowers.length} cell towers in batches...`,
          'InvestigationsService',
        );

        await this.batchProcess(cellTowers, async (batch) => {
          await this.neo4jService.writeCypher(
            `MERGE (i:Investigation {id: $invId})
             WITH i
             UNWIND $towers AS tower
             CREATE (t:CellTower {
               towerId: tower.towerId,
               towerLocation: tower.towerLocation,
               latitude: tower.latitude,
               longitude: tower.longitude,
               coverageRadiusKm: tower.coverageRadiusKm,
               state: tower.state,
               city: tower.city,
               towerType: tower.towerType,
               provider: tower.provider,
               callsOriginatedCount: tower.callsOriginatedCount,
               highRiskCalls: tower.highRiskCalls,
               suspectedOperationType: tower.suspectedOperationType,
               investigationPriority: tower.investigationPriority
             })
             CREATE (i)-[:HAS_TOWER]->(t)`,
            {
              invId: investigationId,
              towers: batch.map((t) => ({
                towerId: t.tower_id,
                towerLocation: t.tower_location || '',
                latitude: parseFloat(String(t.latitude)) || 0,
                longitude: parseFloat(String(t.longitude)) || 0,
                coverageRadiusKm: parseFloat(String(t.coverage_radius_km)) || 0,
                state: t.state || '',
                city: t.city || '',
                towerType: t.tower_type || 'UNKNOWN',
                provider: t.provider || 'UNKNOWN',
                callsOriginatedCount:
                  parseInt(String(t.calls_originated_count)) || 0,
                highRiskCalls: parseInt(String(t.high_risk_calls)) || 0,
                suspectedOperationType: t.suspected_operation_type || null,
                investigationPriority: t.investigation_priority || 'LOW',
              })),
            },
          );
        });

        result.cellTowerCount = cellTowers.length;
        this.logger.success(
          `Ingested ${cellTowers.length} cell towers`,
          'InvestigationsService',
        );
      }

      // 6. Batch Ingest Victims with Enhanced Fields
      if (victims && victims.length > 0) {
        this.logger.log(
          `Ingesting ${victims.length} victims in batches...`,
          'InvestigationsService',
        );

        await this.batchProcess(victims, async (batch) => {
          // First, create Victim nodes with HAS_VICTIM relationship
          await this.neo4jService.writeCypher(
            `MERGE (i:Investigation {id: $invId})
             WITH i
             UNWIND $victims AS victim
             CREATE (v:Victim {
               victimId: victim.victimId,
               name: victim.name,
               phone: victim.phone,
               alternatePhone: victim.alternatePhone,
               reportedIncident: victim.reportedIncident,
               firstReportDate: victim.firstReportDate,
               lastContactDate: victim.lastContactDate,
               callsReceived: victim.callsReceived,
               avgCallsDaywise: victim.avgCallsDaywise,
               totalAmountLost: victim.totalAmountLost,
               areaOfIncident: victim.areaOfIncident,
               policeStation: victim.policeStation,
               firNumber: victim.firNumber,
               caseOfficer: victim.caseOfficer,
               safetyStatus: victim.safetyStatus,
               protectionAssigned: victim.protectionAssigned,
               notes: victim.notes,
               callingSuspects: victim.callingSuspects,
               maxSingleLossTxn: victim.maxSingleLossTxn,
               recoveryAmount: victim.recoveryAmount,
               harassmentSeverity: victim.harassmentSeverity,
               perpetratorNetworkEstimated: victim.perpetratorNetworkEstimated
             })
             CREATE (i)-[:HAS_VICTIM]->(v)
             
             // Also create a Suspect node for victim's phone so CALLED/CDR_CALL can target them
             WITH i, v, victim
             MERGE (vs:Suspect {phone: victim.phone})
             ON CREATE SET vs.id = 'victim_suspect_' + victim.phone,
                          vs.name = victim.name,
                          vs.status = 'VICTIM',
                          vs.isVictim = true,
                          vs.linkedVictimId = victim.victimId
             MERGE (i)-[:CONTAINS]->(vs)`,
            {
              invId: investigationId,
              victims: batch.map((v: any) => ({
                victimId:
                  v.victim_id || v.id || `vic_${Date.now()}_${Math.random()}`,
                name: v.name || v.victim_name || 'Unknown',
                phone: String(v.phone) || '',
                alternatePhone: v.alternate_phone
                  ? String(v.alternate_phone)
                  : null,
                reportedIncident:
                  v.reported_incident || v.reported_loss || 'Fraud Incident',
                firstReportDate:
                  v.first_report_date || v.complaint_date || null,
                lastContactDate: v.last_contact_date || null,
                callsReceived: parseInt(String(v.calls_received || 0)),
                avgCallsDaywise: parseFloat(String(v.avg_calls_daywise || 0)),
                totalAmountLost: parseInt(
                  String(v.total_amount_lost || v.reported_loss || 0),
                ),
                areaOfIncident: v.area_of_incident || '',
                policeStation: v.police_station || null,
                firNumber: v.fir_number || null,
                caseOfficer: v.case_officer || null,
                safetyStatus: v.safety_status || 'UNKNOWN',
                protectionAssigned: v.protection_assigned || 'NO',
                notes: v.notes || null,
                callingSuspects: v.calling_suspects || null,
                maxSingleLossTxn: v.max_single_loss_txn || null,
                recoveryAmount: v.recovery_amount || null,
                harassmentSeverity: v.harassment_severity || 'UNKNOWN',
                perpetratorNetworkEstimated: parseInt(
                  String(v.perpetrator_network_estimated || 0),
                ),
              })),
            },
          );
        });

        result.victimCount = victims.length;
        this.logger.success(
          `Ingested ${victims.length} victims (with Suspect nodes for phone linking)`,
          'InvestigationsService',
        );
      }

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

  /**
   * Helper method to process arrays in batches
   */
  private async batchProcess<T>(
    items: T[],
    processor: (batch: T[]) => Promise<void>,
  ): Promise<void> {
    for (let i = 0; i < items.length; i += this.BATCH_SIZE) {
      const batch = items.slice(i, i + this.BATCH_SIZE);
      await processor(batch);

      if (items.length > this.BATCH_SIZE) {
        const progress = Math.min(i + this.BATCH_SIZE, items.length);
        this.logger.log(
          `Processed ${progress}/${items.length} items`,
          'InvestigationsService',
        );
      }
    }
  }

  async runAnalysis(investigationId: string) {
    this.logger.log(
      `Starting analysis for investigation: ${investigationId}`,
      'InvestigationsService',
    );

    try {
      // Find investigation by id OR caseId
      const graphResult: Record[] = await this.neo4jService.readCypher(
        `MATCH (i:Investigation)
         WHERE i.id = $id OR i.caseId = $id
         MATCH (i)-[:CONTAINS]->(s:Suspect)
         OPTIONAL MATCH (s)-[r:CALLED|TRANSACTION|CDR_CALL]->(t:Suspect)
         RETURN s, collect({rel: r, target: t}) as edges`,
        { id: investigationId },
      );

      const nodes: GraphNode[] = graphResult.map((r) => {
        const s = r.get('s') as Node;
        return {
          id: s.properties.id as string,
          label: s.properties.name as string,
          phone: s.properties.phone as string,
          riskScore: (s.properties.riskScore as number) || 0,
          networkRole: (s.properties.networkRole as string) || 'UNKNOWN',
          status: (s.properties.status as string) || 'ACTIVE',
        };
      });

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

      return { nodes, edges };
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

  /**
   * Advanced analysis queries for investigation insights
   */
  async getInvestigationStats(investigationId: string) {
    const stats = await this.neo4jService.readCypher(
      `MATCH (i:Investigation {id: $invId})
       OPTIONAL MATCH (i)-[:CONTAINS]->(s:Suspect)
       OPTIONAL MATCH (s)-[c:CALLED|CDR_CALL]->()
       OPTIONAL MATCH (s)-[t:TRANSACTION]->()
       OPTIONAL MATCH (i)-[:HAS_VICTIM]->(v:Victim)
       RETURN 
         count(DISTINCT s) as totalSuspects,
         count(DISTINCT c) as totalCalls,
         count(DISTINCT t) as totalTransactions,
         count(DISTINCT v) as totalVictims,
         sum(c.duration) as totalCallDuration,
         sum(t.amount) as totalTransactionAmount,
         avg(s.riskScore) as avgRiskScore,
         sum(v.totalAmountLost) as totalVictimLosses`,
      { invId: investigationId },
    );

    return stats[0];
  }

  /**
   * Find most connected suspects (hub detection)
   */
  async findHubSuspects(investigationId: string, limit: number = 10) {
    return await this.neo4jService.readCypher(
      `MATCH (i:Investigation {id: $invId})-[:CONTAINS]->(s:Suspect)
       OPTIONAL MATCH (s)-[r:CALLED|TRANSACTION|CDR_CALL]-()
       WITH s, count(r) as connections
       ORDER BY connections DESC
       LIMIT $limit
       RETURN s.id as suspectId, s.name as name, s.phone as phone, 
              s.riskScore as riskScore, s.networkRole as networkRole, 
              connections`,
      { invId: investigationId, limit },
    );
  }

  /**
   * Find high-risk suspects based on risk score
   */
  async findHighRiskSuspects(
    investigationId: string,
    minRiskScore: number = 70,
  ) {
    return await this.neo4jService.readCypher(
      `MATCH (i:Investigation {id: $invId})-[:CONTAINS]->(s:Suspect)
       WHERE s.riskScore >= $minRiskScore
       OPTIONAL MATCH (s)-[r:CALLED|TRANSACTION|CDR_CALL]-()
       WITH s, count(r) as connections
       ORDER BY s.riskScore DESC
       RETURN s.id as suspectId, s.name as name, s.phone as phone,
              s.riskScore as riskScore, s.networkRole as networkRole,
              s.arrestWarrantIssued as arrestWarrant, connections`,
      { invId: investigationId, minRiskScore },
    );
  }

  /**
   * Find suspects with time-synchronized transactions and calls
   */
  async findTimeSynchronizedActivity(investigationId: string) {
    return await this.neo4jService.readCypher(
      `MATCH (i:Investigation {id: $invId})-[:CONTAINS]->(s:Suspect)
       MATCH (s)-[c:CALLED]->(t:Suspect)
       WHERE c.timeSynchronizedTxn = true
       RETURN s.id as suspectId, s.name as suspectName, s.phone as suspectPhone,
              t.id as targetId, t.name as targetName, t.phone as targetPhone,
              c.matchingTxnDate as txnDate, c.matchingTxnAmount as txnAmount,
              c.prosecutionGrade as prosecutionGrade
       ORDER BY c.matchingTxnDate DESC`,
      { invId: investigationId },
    );
  }

  /**
   * Find suspicious transactions with high suspicious scores
   */
  async findSuspiciousTransactions(
    investigationId: string,
    minScore: number = 70,
  ) {
    return await this.neo4jService.readCypher(
      `MATCH (i:Investigation {id: $invId})-[:CONTAINS]->(s1:Suspect)
       MATCH (s1)-[t:TRANSACTION]->(s2:Suspect)
       WHERE t.suspiciousScore >= $minScore
       RETURN s1.id as fromSuspectId, s1.name as fromName, s1.account as fromAccount,
              s2.id as toSuspectId, s2.name as toName, s2.account as toAccount,
              t.amount as amount, t.date as date, t.suspiciousScore as suspiciousScore,
              t.actualPurpose as actualPurpose, t.isMuleAccount as isMuleAccount,
              t.moneyLaunderingLayer as launderingLayer,
              t.prosecutionEvidenceGrade as evidenceGrade
       ORDER BY t.suspiciousScore DESC`,
      { invId: investigationId, minScore },
    );
  }

  /**
   * Find mule account networks
   */
  async findMuleAccountNetworks(investigationId: string) {
    return await this.neo4jService.readCypher(
      `MATCH (i:Investigation {id: $invId})-[:CONTAINS]->(s1:Suspect)
       MATCH (s1)-[t:TRANSACTION]->(s2:Suspect)
       WHERE t.isMuleAccount = 'YES'
       WITH s2, collect({from: s1, amount: t.amount, date: t.date}) as incomingTxns
       MATCH (s2)-[t2:TRANSACTION]->(s3:Suspect)
       WITH s2, incomingTxns, collect({to: s3, amount: t2.amount, date: t2.date}) as outgoingTxns
       WHERE size(incomingTxns) > 0 AND size(outgoingTxns) > 0
       RETURN s2.id as muleAccountId, s2.name as muleAccountName, 
              s2.account as accountNumber, s2.bankName as bankName,
              incomingTxns, outgoingTxns,
              size(incomingTxns) as incomingCount,
              size(outgoingTxns) as outgoingCount`,
      { invId: investigationId },
    );
  }

  /**
   * Get prosecution-ready evidence
   */
  async getProsecutionReadyEvidence(investigationId: string) {
    return await this.neo4jService.readCypher(
      `MATCH (i:Investigation {id: $invId})-[:CONTAINS]->(s:Suspect)
       OPTIONAL MATCH (s)-[c:CALLED]->(t:Suspect)
       WHERE c.prosecutionGrade IN ['A_GRADE', 'B_GRADE']
       WITH s, collect({
         type: 'CALL',
         target: t.name,
         grade: c.prosecutionGrade,
         details: {
           callCount: c.callCount,
           duration: c.duration,
           pattern: c.callPattern,
           timeSyncTxn: c.timeSynchronizedTxn
         }
       }) as callEvidence
       OPTIONAL MATCH (s)-[tx:TRANSACTION]->(t2:Suspect)
       WHERE tx.prosecutionEvidenceGrade IN ['A_GRADE', 'B_GRADE']
       WITH s, callEvidence, collect({
         type: 'TRANSACTION',
         target: t2.name,
         grade: tx.prosecutionEvidenceGrade,
         details: {
           amount: tx.amount,
           date: tx.date,
           suspiciousScore: tx.suspiciousScore,
           actualPurpose: tx.actualPurpose
         }
       }) as txnEvidence
       OPTIONAL MATCH (s)-[cdr:CDR_CALL]->(t3:Suspect)
       WHERE cdr.prosecutionReadiness IN ['READY', 'HIGH_CONFIDENCE']
       WITH s, callEvidence, txnEvidence, collect({
         type: 'CDR',
         target: t3.name,
         readiness: cdr.prosecutionReadiness,
         details: {
           callId: cdr.callId,
           duration: cdr.duration,
           distance: cdr.approximateDistanceKm,
           proximityPattern: cdr.proximityPattern
         }
       }) as cdrEvidence
       WHERE size(callEvidence) > 0 OR size(txnEvidence) > 0 OR size(cdrEvidence) > 0
       RETURN s.id as suspectId, s.name as suspectName, s.phone as phone,
              s.riskScore as riskScore, s.arrestWarrantIssued as arrestWarrant,
              callEvidence, txnEvidence, cdrEvidence,
              (size(callEvidence) + size(txnEvidence) + size(cdrEvidence)) as totalEvidenceCount
       ORDER BY totalEvidenceCount DESC`,
      { invId: investigationId },
    );
  }

  /**
   * Analyze victim-suspect connections
   */
  async analyzeVictimSuspectConnections(investigationId: string) {
    return await this.neo4jService.readCypher(
      `MATCH (i:Investigation {id: $invId})-[:HAS_VICTIM]->(v:Victim)
       MATCH (i)-[:CONTAINS]->(s:Suspect)
       WHERE s.phone IN split(v.callingSuspects, ',')
          OR s.id IN [v.matched_suspect_id]
       OPTIONAL MATCH (s)-[c:CALLED]->(s2:Suspect)
       WHERE toString(s2.phone) = toString(v.phone)
       WITH v, s, c, count(c) as callCount
       RETURN v.victimId as victimId, v.name as victimName, v.phone as victimPhone,
              v.totalAmountLost as totalLoss, v.harassmentSeverity as severity,
              collect({
                suspectId: s.id,
                suspectName: s.name,
                suspectPhone: s.phone,
                riskScore: s.riskScore,
                networkRole: s.networkRole,
                callCount: callCount
              }) as connectedSuspects
       ORDER BY v.totalAmountLost DESC`,
      { invId: investigationId },
    );
  }

  /**
   * Find cell tower hotspots (towers with high criminal activity)
   */
  async findCellTowerHotspots(
    investigationId: string,
    minHighRiskCalls: number = 10,
  ) {
    return await this.neo4jService.readCypher(
      `MATCH (i:Investigation {id: $invId})-[:HAS_TOWER]->(t:CellTower)
       WHERE t.highRiskCalls >= $minHighRiskCalls
       OPTIONAL MATCH (i)-[:CONTAINS]->(s:Suspect)-[c:CDR_CALL]->()
       WHERE c.callerTowerId = t.towerId OR c.receiverTowerId = t.towerId
       WITH t, count(DISTINCT s) as uniqueSuspects, count(c) as totalCalls
       RETURN t.towerId as towerId, t.towerLocation as location,
              t.latitude as latitude, t.longitude as longitude,
              t.city as city, t.state as state,
              t.highRiskCalls as highRiskCalls,
              t.suspectedOperationType as operationType,
              t.investigationPriority as priority,
              uniqueSuspects, totalCalls
       ORDER BY t.highRiskCalls DESC`,
      { invId: investigationId, minHighRiskCalls },
    );
  }

  /**
   * Trace suspect movement patterns using CDR data
   */
  async traceSuspectMovement(investigationId: string, suspectId: string) {
    return await this.neo4jService.readCypher(
      `MATCH (i:Investigation {id: $invId})-[:CONTAINS]->(s:Suspect {id: $suspectId})
       MATCH (s)-[c:CDR_CALL]->()
       RETURN c.callId as callId, c.callStartTime as timestamp,
              c.callerTowerId as towerId, c.proximityPattern as pattern,
              c.suspectMovementSequenceNumber as sequenceNumber,
              c.approximateDistanceKm as distance
       ORDER BY c.suspectMovementSequenceNumber ASC, c.callStartTime ASC`,
      { invId: investigationId, suspectId },
    );
  }

  /**
   * Find network hierarchy and leadership structure
   */
  async analyzeNetworkHierarchy(investigationId: string) {
    return await this.neo4jService.readCypher(
      `MATCH (i:Investigation {id: $invId})-[:CONTAINS]->(s:Suspect)
       WHERE s.networkHierarchyLevel > 0
       OPTIONAL MATCH (s)-[r:CALLED|TRANSACTION]-()
       WITH s, count(r) as connections
       ORDER BY s.networkHierarchyLevel DESC, connections DESC
       RETURN s.id as suspectId, s.name as name, s.phone as phone,
              s.networkRole as role, s.networkHierarchyLevel as hierarchyLevel,
              s.teamSize as teamSize, s.operationalCapability as capability,
              s.riskScore as riskScore, connections
       LIMIT 20`,
      { invId: investigationId },
    );
  }

  /**
   * Sync cell towers from Supabase to Neo4j as global CellTower nodes
   * Creates towers and links them to all Investigation nodes via HAS_TOWER
   */
  async syncTowersToNeo4j(
    investigationId: string,
  ): Promise<{ towerCount: number; message: string }> {
    this.logger.log(
      `Syncing cell towers from Supabase to Neo4j for investigation ${investigationId}`,
      'InvestigationsService',
    );

    try {
      // Step 1: Get unique tower IDs used in this investigation's CDR records
      const towerQuery = `
        MATCH (i:Investigation {id: $invId})-[:CONTAINS]->(s:Suspect)
        OPTIONAL MATCH (s)-[cdr:CDR_CALL]->()
        WITH collect(DISTINCT cdr.callerTowerId) + collect(DISTINCT cdr.receiverTowerId) AS allTowerIds
        UNWIND allTowerIds AS towerId
        WITH towerId
        WHERE towerId IS NOT NULL
        RETURN DISTINCT towerId
      `;

      const towerRecords = await this.neo4jService.readCypher(towerQuery, {
        invId: investigationId,
      });

      const towerIds = towerRecords
        .map((r) => r.get('towerId'))
        .filter(Boolean) as string[];

      if (towerIds.length === 0) {
        this.logger.warn(
          `No tower IDs found in CDR records for investigation ${investigationId}`,
          'InvestigationsService',
        );
        return {
          towerCount: 0,
          message: 'No tower IDs found in CDR records',
        };
      }

      this.logger.log(
        `Found ${towerIds.length} unique tower IDs in investigation`,
        'InvestigationsService',
      );
      this.logger.log(
        `First 10 tower IDs: ${JSON.stringify(towerIds.slice(0, 10))}`,
        'InvestigationsService',
      );

      // Step 2: Fetch tower coordinates from Supabase
      this.logger.log(
        `Fetching tower data from Supabase for ${towerIds.length} tower IDs...`,
        'InvestigationsService',
      );
      const towers = await this.supabaseService.getTowersByIds(towerIds);

      this.logger.log(
        `Supabase returned ${towers.length} towers`,
        'InvestigationsService',
      );

      if (towers.length > 0) {
        this.logger.log(
          `Sample tower from Supabase: ${JSON.stringify(towers[0])}`,
          'InvestigationsService',
        );
      }

      if (towers.length === 0) {
        this.logger.warn(
          `No tower coordinates found in Supabase for ${towerIds.length} tower IDs`,
          'InvestigationsService',
        );
        return {
          towerCount: 0,
          message: 'No tower data found in Supabase',
        };
      }

      this.logger.log(
        `Fetched ${towers.length} tower coordinates from Supabase`,
        'InvestigationsService',
      );

      // Step 3: Create global CellTower nodes and link to ALL investigations
      await this.batchProcess(towers, async (batch) => {
        await this.neo4jService.writeCypher(
          `UNWIND $towers AS tower
           // Create or update global CellTower node
           MERGE (t:CellTower {towerId: tower.towerId})
           ON CREATE SET 
             t.towerLocation = tower.towerLocation,
             t.latitude = tower.latitude,
             t.longitude = tower.longitude,
             t.coverageRadiusKm = tower.coverageRadiusKm
           ON MATCH SET
             t.towerLocation = tower.towerLocation,
             t.latitude = tower.latitude,
             t.longitude = tower.longitude,
             t.coverageRadiusKm = tower.coverageRadiusKm
           
           // Link to ALL Investigation nodes
           WITH t
           MATCH (i:Investigation)
           MERGE (i)-[:HAS_TOWER]->(t)`,
          {
            towers: batch.map((t) => ({
              towerId: t.cell_id,
              towerLocation: t.name || t.cell_id,
              latitude: t.lat,
              longitude: t.lon,
              coverageRadiusKm: t.range_km || 2.0,
            })),
          },
        );
      });

      this.logger.success(
        `Synced ${towers.length} cell towers to Neo4j and linked to all investigations`,
        'InvestigationsService',
      );

      return {
        towerCount: towerIds.length,
        message: `Successfully synced ${towerIds.length} towers to Neo4j`,
      };
    } catch (error) {
      this.logger.error(
        `Failed to sync towers: ${error}`,
        undefined,
        'InvestigationsService',
      );
      throw error;
    }
  }

  /**
   * Get detailed call patterns for an investigation
   * Aggregates by caller-receiver pair and enriches with tower data
   */
  async getCallPatterns(investigationId: string): Promise<CallPattern[]> {
    this.logger.log(
      `Fetching call patterns for ${investigationId}`,
      'InvestigationsService',
    );

    const query = `
      MATCH (i:Investigation)
      WHERE i.id = $invId OR i.caseId = $invId
      WITH i
      MATCH (i)-[:CONTAINS]->(c:Suspect)
      MATCH (c)-[r:CDR_CALL|CALLED]->(t:Suspect)
      WHERE (i)-[:CONTAINS]->(t)
      
      WITH c, t, r,
           CASE WHEN r.duration IS NOT NULL THEN r.duration ELSE 0 END as call_dur,
           CASE WHEN r.callerTowerId IS NOT NULL THEN r.callerTowerId ELSE null END as tower_id
      
      WITH c.id as callerId, c.name as callerName, c.phone as callerPhone,
           t.id as receiverId, t.name as receiverName, t.phone as receiverPhone,
           count(r) as call_count,
           sum(call_dur) as total_duration,
           collect(DISTINCT tower_id) as tower_ids
      
      RETURN {
        callerId: callerId,
        callerName: callerName,
        callerPhone: callerPhone,
        receiverId: receiverId,
        receiverName: receiverName,
        receiverPhone: receiverPhone,
        callCount: call_count,
        totalDuration: total_duration,
        towerIds: [tid IN tower_ids WHERE tid IS NOT NULL]
      } as pattern
      ORDER BY call_count DESC
    `;

    try {
      const records = await this.neo4jService.readCypher(query, {
        invId: investigationId,
      });

      const rawPatterns = records.map((r) =>
        convertNeo4jIntegers(r.get('pattern')),
      );

      // Enrich with towers from Supabase
      const allTowerIds = [
        ...new Set(rawPatterns.flatMap((p) => p.towerIds)),
      ] as string[];

      const towers =
        allTowerIds.length > 0
          ? await this.supabaseService.getTowersByIds(allTowerIds)
          : [];
      const towerMap = new Map(towers.map((t) => [t.cell_id, t]));

      const enrichedPatterns: CallPattern[] = rawPatterns.map((p) => {
        const enrichedTowers = (p.towerIds || [])
          .map((tid: string) => {
            const tower = towerMap.get(tid);
            return tower
              ? {
                  id: tid,
                  name: tower.name || 'Unknown',
                  lat: tower.lat,
                  lon: tower.lon,
                }
              : { id: tid, name: 'Unknown Tower', lat: 0, lon: 0 };
          })
          .filter(Boolean);

        return {
          callerId: p.callerId,
          callerName: p.callerName,
          callerPhone: p.callerPhone,
          receiverId: p.receiverId,
          receiverName: p.receiverName,
          receiverPhone: p.receiverPhone,
          callCount: p.callCount,
          totalDuration: p.totalDuration,
          towers: enrichedTowers,
          riskLevel:
            p.callCount > 50
              ? 'CRITICAL'
              : p.callCount > 20
                ? 'HIGH'
                : 'MEDIUM',
        };
      });

      this.logger.success(
        `Found ${enrichedPatterns.length} call patterns`,
        'InvestigationsService',
      );
      return enrichedPatterns;
    } catch (error) {
      this.logger.error(
        `Failed to get call patterns: ${error}`,
        undefined,
        'InvestigationsService',
      );
      throw error;
    }
  }
}
