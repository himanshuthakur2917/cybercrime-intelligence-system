-- Migration: Create cell_towers_2 table with PostGIS support
-- This table stores Delhi region cell towers with geographic coordinates
-- Enable PostGIS extension if not already enabled
CREATE EXTENSION IF NOT EXISTS postgis;
-- Create cell_towers_2 table
CREATE TABLE IF NOT EXISTS cell_towers_2 (
  id SERIAL PRIMARY KEY,
  cell_id VARCHAR(50) UNIQUE NOT NULL,
  name VARCHAR(255),
  location GEOMETRY(Point, 4326) NOT NULL,
  range_km DECIMAL(5, 2) DEFAULT 2.0,
  operator VARCHAR(50),
  tower_type VARCHAR(20) DEFAULT 'GSM',
  address TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
-- Create spatial index for faster geographic queries
CREATE INDEX IF NOT EXISTS idx_cell_towers_2_location ON cell_towers_2 USING GIST (location);
-- Create index on cell_id for faster lookups
CREATE INDEX IF NOT EXISTS idx_cell_towers_2_cell_id ON cell_towers_2 (cell_id);
-- Add helper columns for lat/lon (computed from geometry)
ALTER TABLE cell_towers_2
ADD COLUMN IF NOT EXISTS lat DECIMAL(10, 8) GENERATED ALWAYS AS (ST_Y(location)) STORED;
ALTER TABLE cell_towers_2
ADD COLUMN IF NOT EXISTS lon DECIMAL(11, 8) GENERATED ALWAYS AS (ST_X(location)) STORED;
-- RPC function to get all towers with coordinates
CREATE OR REPLACE FUNCTION get_all_towers_v2(limit_count INT DEFAULT 1000) RETURNS TABLE (
    cell_id VARCHAR,
    name VARCHAR,
    lat DECIMAL,
    lon DECIMAL,
    range_km DECIMAL,
    operator VARCHAR
  ) AS $$ BEGIN RETURN QUERY
SELECT t.cell_id,
  t.name,
  t.lat,
  t.lon,
  t.range_km,
  t.operator
FROM cell_towers_2 t
ORDER BY t.id
LIMIT limit_count;
END;
$$ LANGUAGE plpgsql;
-- RPC function to get towers by IDs
CREATE OR REPLACE FUNCTION get_towers_by_ids_v2(tower_ids TEXT []) RETURNS TABLE (
    cell_id VARCHAR,
    name VARCHAR,
    lat DECIMAL,
    lon DECIMAL,
    range_km DECIMAL
  ) AS $$ BEGIN RETURN QUERY
SELECT t.cell_id,
  t.name,
  t.lat,
  t.lon,
  t.range_km
FROM cell_towers_2 t
WHERE t.cell_id = ANY(tower_ids);
END;
$$ LANGUAGE plpgsql;
-- RPC function to get towers within bounding box
CREATE OR REPLACE FUNCTION get_towers_in_bounds_v2(
    min_lat DECIMAL,
    min_lon DECIMAL,
    max_lat DECIMAL,
    max_lon DECIMAL,
    limit_count INT DEFAULT 1000
  ) RETURNS TABLE (
    cell_id VARCHAR,
    name VARCHAR,
    lat DECIMAL,
    lon DECIMAL,
    range_km DECIMAL
  ) AS $$ BEGIN RETURN QUERY
SELECT t.cell_id,
  t.name,
  t.lat,
  t.lon,
  t.range_km
FROM cell_towers_2 t
WHERE ST_Intersects(
    t.location,
    ST_MakeEnvelope(min_lon, min_lat, max_lon, max_lat, 4326)
  )
LIMIT limit_count;
END;
$$ LANGUAGE plpgsql;
-- Comment on table
COMMENT ON TABLE cell_towers_2 IS 'Delhi region cell tower locations for CDR triangulation';