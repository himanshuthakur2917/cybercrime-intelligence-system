export interface Investigation {
  id?: string;
  caseId: string;
  name: string;
  createdBy?: string;
  createdAt?: string;
  status?: string;
}

// Suspect record matching suspects_enhanced.csv
export interface Suspects {
  suspect_id: string;
  name: string;
  phone: number | string;
  alternate_phone?: string;
  account?: string;
  bank_name?: string;
  fir_id: string;
  status: string;
  alias_names?: string;
  risk_score?: number;
  known_associates?: string;
  last_known_location?: string;
  aadhar_hash?: string;
  pan_hash?: string;
  device_imei?: string;
  network_role?: string;
  device_phones?: string;
  network_hierarchy_level?: number;
  estimated_assets?: string;
  team_size?: number;
  operational_capability?: string;
  arrest_warrant_issued?: string;
  trajectory_history?: string;
}

// Call record matching calls_enhanced.csv
export interface CallRecord {
  caller_phone: number | string;
  receiver_phone: number | string;
  call_count: number;
  total_duration: number;
  call_date: string;
  first_call_time?: string;
  last_call_time?: string;
  avg_call_duration?: number;
  max_call_duration?: number;
  min_call_duration?: number;
  call_pattern?: string;
  proximity_pattern?: string;
  matched_suspect_id?: string;
  matched_victim_id?: string;
  calls_per_day?: number;
  time_synchronized_txn?: boolean | string;
  matching_txn_date?: string;
  matching_txn_amount?: string;
  prosecution_grade?: string;
}

// Transaction record matching transactions_enhanced.csv
export interface TransactionRecord {
  from_account: string;
  to_account: string;
  amount: number;
  date: string;
  time?: string;
  purpose?: string;
  transaction_type?: string;
  bank_ref?: string;
  status?: string;
  suspicious_score?: number;
  linked_fir?: string;
  notes?: string;
  source_suspect_id?: string;
  actual_purpose?: string;
  money_laundering_layer?: number;
  destination_type?: string;
  is_mule_account?: string;
  time_sync_call_id?: string;
  matched_victim_id?: string;
  prosecution_evidence_grade?: string;
}

export interface csvData {
  suspects: Suspects[];
  calls: CallRecord[];
  transactions: TransactionRecord[];
}

// CDR Record matching cdr_enhanced.csv
export interface CDRRecord {
  call_id: string;
  caller_phone: string;
  receiver_phone: string;
  caller_tower_id: string;
  receiver_tower_id: string;
  call_start_time: string;
  call_duration_seconds: number;
  proximity_pattern: 'NEAR' | 'MEDIUM' | 'DISTANT' | string;
  approximate_distance_km: number;
  matched_suspect_id?: string;
  matched_victim_id?: string;
  matched_transaction_id?: string;
  suspect_movement_sequence_number?: number;
  prosecution_readiness?: string;
}

// Cell tower matching cell_towers_enhanced.csv
export interface CellTower {
  tower_id: string;
  tower_location?: string;
  latitude: number;
  longitude: number;
  coverage_radius_km?: number;
  state?: string;
  city?: string;
  tower_type?: string;
  provider?: string;
  calls_originated_count?: number;
  high_risk_calls?: number;
  suspected_operation_type?: string;
  investigation_priority?: string;
}

// Victim record matching victims_enhanced.csv
export interface Victim {
  victim_id: string;
  name: string;
  phone: string;
  alternate_phone?: string;
  reported_incident: string;
  first_report_date?: string;
  last_contact_date?: string;
  calls_received: number;
  avg_calls_daywise: number;
  total_amount_lost?: number;
  area_of_incident: string;
  police_station?: string;
  fir_number?: string;
  case_officer?: string;
  safety_status: 'THREATENED' | 'SAFE' | 'RELOCATED' | string;
  protection_assigned?: string;
  notes?: string;
  calling_suspects?: string;
  max_single_loss_txn?: string;
  recovery_amount?: string;
  harassment_severity?: string;
  perpetrator_network_estimated?: number;
}

// Extended CSV data including geolocation features
export interface ExtendedCsvData extends csvData {
  cdrRecords?: CDRRecord[];
  cellTowers?: CellTower[];
  victims?: Victim[];
}
