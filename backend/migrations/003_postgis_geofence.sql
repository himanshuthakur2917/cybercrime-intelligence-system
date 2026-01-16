-- PostGIS Geofencing Logic
-- Enable PostGIS if not already enabled
CREATE EXTENSION IF NOT EXISTS postgis;
-- Ensure tables exist with proper geometry columns
-- (These tables might already exist from previous phases, but we ensure structure)
ALTER TABLE IF EXISTS restricted_zones DROP COLUMN IF EXISTS boundary;
ALTER TABLE restricted_zones
ADD COLUMN boundary GEOGRAPHY(POLYGON, 4326);
-- The "Geopis" Check Function
-- Takes lat, lon and returns names of containing restricted zones
CREATE OR REPLACE FUNCTION check_geofence(lat float8, lon float8) RETURNS TABLE (zone_name text) AS $$ BEGIN RETURN QUERY
SELECT name
FROM restricted_zones
WHERE ST_Contains(
    boundary::geometry,
    ST_SetSRID(ST_Point(lon, lat), 4326)
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
-- Create GIST index for fast spatial queries
CREATE INDEX IF NOT EXISTS restricted_zones_boundary_idx ON restricted_zones USING GIST (boundary);