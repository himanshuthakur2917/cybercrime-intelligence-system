export interface Investigation {
  id?: string;
  caseId: string;
  name: string;
  createdBy?: string;
  createdAt?: string;
  status?: string;
}

export interface Suspects {
  suspect_id: string;
  name: string;
  phone: number;
  account: string;
  fir_id: string;
  status: string;
}

export interface CallRecord {
  caller_phone: number;
  receiver_phone: number;
  call_count: number;
  total_duration: number;
  call_date: string;
}

export interface TransactionRecord {
  from_account: string;
  to_account: string;
  amount: number;
  date: string;
  purpose: string;
}

export interface csvData {
  suspects: Suspects[];
  calls: CallRecord[];
  transactions: TransactionRecord[];
}

// CDR Record with triangulation data for geolocation tracking
export interface CDRRecord {
  call_id: string;
  caller_phone: string;
  receiver_phone: string;
  caller_tower_id: string;
  caller_tower_location: string;
  caller_lat: number;
  caller_lon: number;
  receiver_tower_id: string;
  receiver_tower_location: string;
  receiver_lat: number;
  receiver_lon: number;
  call_start_time: string;
  call_duration_seconds: number;
  roaming_status: string;
  // Triangulation fields
  triangulation_lat: number;
  triangulation_lon: number;
  triangulation_accuracy_m: number;
  proximity_pattern: 'NEAR' | 'MEDIUM' | 'DISTANT';
  signal_confidence: number;
  approximate_distance_km: number;
}

// Cell tower for geolocation reference
export interface CellTower {
  tower_id: string;
  latitude: number;
  longitude: number;
  location: string;
  region: string;
  city: string;
  coverage_type: string;
  tower_height_meters: number;
}

// Victim record for harassment detection
export interface Victim {
  victim_id: string;
  name: string;
  phone: string;
  reported_incident: string;
  calls_received: number;
  avg_calls_daywise: number;
  area_of_incident: string;
  safety_status: 'THREATENED' | 'SAFE' | 'RELOCATED';
}

// Extended CSV data including geolocation features
export interface ExtendedCsvData extends csvData {
  cdrRecords?: CDRRecord[];
  cellTowers?: CellTower[];
  victims?: Victim[];
}
