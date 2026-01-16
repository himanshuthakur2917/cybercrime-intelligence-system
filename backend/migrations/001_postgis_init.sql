-- ============================================
-- PostGIS Initialization for Hybrid CIS
-- Run this in Supabase SQL Editor
-- ============================================
-- Enable PostGIS extension
CREATE EXTENSION IF NOT EXISTS postgis;
-- ============================================
-- INFRASTRUCTURE TABLES (Static Data)
-- ============================================
-- Cell Towers - Point locations
CREATE TABLE IF NOT EXISTS cell_towers (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  cell_id TEXT UNIQUE NOT NULL,
  name TEXT,
  location GEOGRAPHY(POINT, 4326),
  range_km FLOAT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
-- Create spatial index for fast queries
CREATE INDEX IF NOT EXISTS idx_cell_towers_location ON cell_towers USING GIST (location);
-- ============================================
-- RESTRICTED ZONES (Geofence Boundaries)
-- ============================================
-- Restricted Zones - Polygon boundaries
CREATE TABLE IF NOT EXISTS restricted_zones (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  boundary GEOGRAPHY(POLYGON, 4326),
  risk_level TEXT DEFAULT 'HIGH',
  created_at TIMESTAMPTZ DEFAULT NOW()
);
-- Create spatial index for geofence checks
CREATE INDEX IF NOT EXISTS idx_restricted_zones_boundary ON restricted_zones USING GIST (boundary);
-- ============================================
-- INVESTIGATION MANAGEMENT (SQL Side)
-- ============================================
-- Investigations table (pivot point with Neo4j)
CREATE TABLE IF NOT EXISTS investigations (
  id UUID PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  status TEXT DEFAULT 'ACTIVE',
  created_by UUID,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
-- ============================================
-- AUDIT LOGGING (Immutable Trail)
-- ============================================
-- Audit logs for all critical actions
CREATE TABLE IF NOT EXISTS audit_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  action TEXT NOT NULL,
  entity_type TEXT,
  entity_id UUID,
  user_id UUID,
  metadata JSONB,
  timestamp TIMESTAMPTZ DEFAULT NOW()
);
-- Index for audit queries
CREATE INDEX IF NOT EXISTS idx_audit_logs_timestamp ON audit_logs (timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_entity ON audit_logs (entity_type, entity_id);
-- ============================================
-- GEOFENCE CHECK FUNCTION
-- ============================================
-- Function to check if a point is inside any restricted zone
-- Returns table of zone names that contain the point
CREATE OR REPLACE FUNCTION check_geofence(lat FLOAT, lon FLOAT) RETURNS TABLE (zone_name TEXT) AS $$ BEGIN RETURN QUERY
SELECT rz.name
FROM restricted_zones rz
WHERE ST_Contains(
    rz.boundary::geometry,
    ST_SetSRID(ST_Point(lon, lat), 4326)
  );
END;
$$ LANGUAGE plpgsql;
-- ============================================
-- HELPER FUNCTIONS
-- ============================================
-- Function to insert cell tower with coordinate conversion
CREATE OR REPLACE FUNCTION insert_cell_tower(
    p_cell_id TEXT,
    p_name TEXT,
    p_lat FLOAT,
    p_lon FLOAT,
    p_range_km FLOAT DEFAULT NULL
  ) RETURNS UUID AS $$
DECLARE v_id UUID;
BEGIN
INSERT INTO cell_towers (cell_id, name, location, range_km)
VALUES (
    p_cell_id,
    p_name,
    ST_SetSRID(ST_Point(p_lon, p_lat), 4326)::geography,
    p_range_km
  ) ON CONFLICT (cell_id) DO
UPDATE
SET name = EXCLUDED.name,
  location = EXCLUDED.location,
  range_km = EXCLUDED.range_km
RETURNING id INTO v_id;
RETURN v_id;
END;
$$ LANGUAGE plpgsql;
-- Function to insert restricted zone with WKT polygon
CREATE OR REPLACE FUNCTION insert_restricted_zone(
    p_name TEXT,
    p_polygon_wkt TEXT,
    p_description TEXT DEFAULT NULL,
    p_risk_level TEXT DEFAULT 'HIGH'
  ) RETURNS UUID AS $$
DECLARE v_id UUID;
BEGIN
INSERT INTO restricted_zones (name, description, boundary, risk_level)
VALUES (
    p_name,
    p_description,
    ST_GeomFromText(p_polygon_wkt, 4326)::geography,
    p_risk_level
  )
RETURNING id INTO v_id;
RETURN v_id;
END;
$$ LANGUAGE plpgsql;
-- ============================================
-- SAMPLE DATA (for testing)
-- ============================================
-- Insert a sample restricted zone (Ranchi Airport area)
SELECT insert_restricted_zone(
    'Birsa Munda Airport Zone',
    'POLYGON((85.3150 23.3200, 85.3350 23.3200, 85.3350 23.3350, 85.3150 23.3350, 85.3150 23.3200))',
    'Restricted airspace and security perimeter',
    'CRITICAL'
  );
-- Insert sample cell towers
SELECT insert_cell_tower(
    'TOWER_001',
    'Main Market Tower',
    23.3441,
    85.3096,
    2.5
  );
SELECT insert_cell_tower(
    'TOWER_002',
    'Railway Station Tower',
    23.3568,
    85.3340,
    3.0
  );
SELECT insert_cell_tower(
    'TOWER_003',
    'RIMS Hospital Tower',
    23.3780,
    85.3250,
    2.0
  );