/**
 * Map Visualization Helper Types
 * For victim-caller connections and triangulation display
 */

export interface SuspectMarker {
  id: string;
  name: string;
  phone: string;
  position: { lat: number; lon: number };
  towerId?: string;
  towerName?: string;
  callCount: number;
  riskLevel: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
}

export interface CallConnection {
  callId: string;
  caller: SuspectMarker;
  victim: SuspectMarker;
  distance_km: number;
  callTime: string;
  duration: number;
  direction: "INCOMING" | "OUTGOING";
  riskLevel: "LOW" | "MEDIUM" | "HIGH";
}

export interface TriangulatedPosition {
  suspectId: string;
  suspectName: string;
  estimatedLocation: { lat: number; lon: number };
  accuracyMeters: number;
  towerCount: number;
  towersUsed: Array<{
    id: string;
    name: string;
    position: { lat: number; lon: number };
  }>;
  confidence: "HIGH" | "MEDIUM" | "LOW";
  timestamp: Date;
}

export interface MapState {
  selectedVictimId?: string;
  selectedSuspectId?: string;
  showConnections: boolean;
  showTriangulation: boolean;
  rangeFilterKm?: number;
  connections: CallConnection[];
  triangulations: TriangulatedPosition[];
}
