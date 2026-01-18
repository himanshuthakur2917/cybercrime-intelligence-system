import {
  IsString,
  IsOptional,
  IsNumber,
  Min,
  Max,
  IsArray,
  IsEnum,
} from 'class-validator';

export class TriangulationRequestDto {
  @IsString()
  investigationId: string;

  @IsOptional()
  @IsString()
  suspectId?: string;

  @IsOptional()
  @IsString()
  victimId?: string;

  @IsOptional()
  @IsNumber()
  @Min(10)
  @Max(50000)
  rangeMeters?: number;

  @IsOptional()
  @IsNumber()
  @Min(0.01)
  @Max(50)
  rangeKm?: number;
}

export class VictimCallerMapDto {
  @IsString()
  investigationId: string;

  @IsString()
  victimId: string;

  @IsOptional()
  @IsNumber()
  @Min(0.1)
  @Max(100)
  rangeKm?: number;
}

export class RangeFilterDto {
  @IsString()
  investigationId: string;

  @IsNumber()
  centerLat: number;

  @IsNumber()
  centerLon: number;

  @IsNumber()
  @Min(0.1)
  @Max(100)
  rangeKm: number;
}

export enum RangeUnit {
  METERS = 'meters',
  KILOMETERS = 'km',
}

export class TriangulationResult {
  suspectId: string;
  suspectName: string;
  estimatedLocation: {
    lat: number;
    lon: number;
  };
  accuracyMeters: number;
  towerCount: number;
  towersUsed: string[];
  phantomTowers?: string[]; // 🆕 Towers that don't exist in Supabase
  confidence: 'HIGH' | 'MEDIUM' | 'LOW';
  timestamp: Date;
}

export class VictimCallerConnection {
  callId: string;
  caller: {
    id: string;
    name: string;
    phone: string;
  };
  victim: {
    id: string;
    name: string;
    phone: string;
  };
  callerPosition: {
    lat: number;
    lon: number;
    towerId: string;
    towerName?: string;
  };
  victimPosition: {
    lat: number;
    lon: number;
    towerId: string;
    towerName?: string;
  };
  distance_km: number;
  callTime: string;
  duration: number;
  direction: 'INCOMING' | 'OUTGOING';
  riskLevel: 'HIGH' | 'MEDIUM' | 'LOW';
}
