export interface Position {
  lat: number;
  lon: number;
  accuracy_m?: number;
  tower_id?: string;
}

export interface MapMarker {
  call_id: string;
  caller: { id: string; name: string; phone: string };
  receiver: { id: string; name: string; phone: string };
  caller_position: Position;
  receiver_position: Position;
  tower: { id: string; location: string; lat: number; lon: number };
  proximity_pattern: string;
  distance_km: number;
  call_duration: number;
  call_time: string;
  risk_level: string;
}

export interface CellTower {
  tower_id: string;
  location: string;
  latitude: number;
  longitude: number;
  city?: string;
  state?: string;
  provider?: string;
  high_risk_calls?: number;
  investigation_priority?: string;
}

export interface ConvergencePoint {
  victim_id: string;
  victim_name: string;
  convergence_lat: number;
  convergence_lon: number;
  unique_callers: number;
  caller_names: string[];
  total_interactions: number;
  zone_severity: "CRITICAL" | "HIGH" | "MEDIUM" | "LOW";
}

export interface MapDataResponse {
  markers: MapMarker[];
  cellTowers: CellTower[];
}

// Connected suspect within a victim relationship
export interface ConnectedSuspect {
  suspect_id: string;
  suspect_name: string;
  suspect_phone: string;
  risk_score: number;
  network_role: string;
}

// Updated VictimRelationship to match new backend response
export interface VictimRelationship {
  victim_id: string;
  victim_name: string;
  victim_phone: string;
  total_amount_lost: number;
  safety_status: string;
  harassment_severity: string;
  connected_suspects: ConnectedSuspect[];
  call_count: number;
  risk_level: "CRITICAL" | "HIGH" | "MEDIUM" | "LOW";
}

export interface HarassmentPattern {
  caller_id: string;
  caller_name: string;
  caller_phone: string;
  victim_id: string;
  victim_name: string;
  victim_phone: string;
  harassment_type: string;
  evidence_count: number;
  harassment_severity: "CRITICAL" | "HIGH" | "MEDIUM" | "LOW";
  recommended_action: string;
}

// Legacy Relationship interface for backwards compatibility
export interface Relationship {
  caller_name: string;
  caller_phone: string;
  victim_name: string;
  victim_phone: string;
  call_count: number;
  total_duration: string;
  pattern_type: string;
  risk_level: string;
  caller_id?: string;
  victim_id?: string;
}

export interface VictimMappingResponse {
  relationships: VictimRelationship[];
  convergencePoints?: ConvergencePoint[];
  summary?: {
    totalRelationships: number;
    convergenceZones: number;
    criticalCases: number;
    highRiskCases: number;
  };
}

export interface PatternResponse {
  harassmentPatterns: HarassmentPattern[];
  collaborativeCalls?: any[];
}

export interface TrajectoryPoint {
  call_id: string;
  timestamp: string;
  position: { latitude: number; longitude: number; tower_id: string };
  tower_location: string;
  receiver_phone: string;
  duration_seconds: number;
}

export interface TrajectoryResponse {
  trajectory: TrajectoryPoint[];
  pointCount?: number;
}

export interface PredictionData {
  suspect_id: string;
  suspect_name: string;
  suspect_phone: string;
  predicted_location: string;
  confidence_level: "HIGH" | "MEDIUM" | "LOW";
  last_known_position: {
    latitude: number;
    longitude: number;
    timestamp: string;
    tower_id: string;
  };
  movement_pattern: string[];
}

export interface PredictionResponse {
  currentLocationPrediction: PredictionData | null;
}
