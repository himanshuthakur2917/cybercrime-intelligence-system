-- ============================================
-- Cell Tower Triangulation Functions
-- PostGIS-based location calculation
-- ============================================
-- Enable PostGIS if not already enabled
CREATE EXTENSION IF NOT EXISTS postgis;
-- ============================================
-- TRIANGULATION FUNCTION
-- ============================================
-- Function to triangulate position from multiple cell tower pings
-- Uses intersection of circular coverage areas to estimate location
CREATE OR REPLACE FUNCTION triangulate_position(
    tower_ids TEXT [],
    tower_ranges FLOAT [] DEFAULT NULL
  ) RETURNS TABLE(
    lat FLOAT,
    lon FLOAT,
    accuracy_m FLOAT,
    tower_count INT
  ) AS $$
DECLARE centroid_point geometry;
num_towers INT;
avg_range_m FLOAT;
max_dist_m FLOAT;
BEGIN num_towers := array_length(tower_ids, 1);
-- Get tower locations
WITH tower_data AS (
  SELECT ct.location::geometry AS geom,
    COALESCE(ct.range_km, 2.0) * 1000 AS range_m
  FROM cell_towers ct
  WHERE ct.cell_id = ANY(tower_ids)
)
SELECT ST_Centroid(ST_Collect(geom)),
  AVG(range_m) INTO centroid_point,
  avg_range_m
FROM tower_data;
-- Calculate max distance from centroid to any tower to determine uncertainty
SELECT MAX(
    ST_Distance(
      centroid_point::geography,
      ct.location::geography
    )
  ) INTO max_dist_m
FROM cell_towers ct
WHERE ct.cell_id = ANY(tower_ids);
-- Accuracy is narrowed down by the number of towers (statistical confidence)
-- but bound by the physical spread of the towers
RETURN QUERY
SELECT ST_Y(ST_Transform(centroid_point, 4326))::FLOAT AS lat,
  ST_X(ST_Transform(centroid_point, 4326))::FLOAT AS lon,
  GREATEST(
    COALESCE(max_dist_m, 0),
    avg_range_m / |/ GREATEST(num_towers, 1)
  )::FLOAT AS accuracy_m,
  num_towers AS tower_count;
END;
$$ LANGUAGE plpgsql;
-- ============================================
-- RANGE FILTERING FUNCTION
-- ============================================
-- Function to get callers within range of a victim location
CREATE OR REPLACE FUNCTION get_callers_in_range(
    victim_lat FLOAT,
    victim_lon FLOAT,
    search_range_km FLOAT DEFAULT 10.0
  ) RETURNS TABLE(
    caller_lat FLOAT,
    caller_lon FLOAT,
    distance_km FLOAT,
    cell_tower_id TEXT,
    tower_name TEXT
  ) AS $$ BEGIN RETURN QUERY
SELECT ST_Y(ct.location::geometry)::FLOAT AS caller_lat,
  ST_X(ct.location::geometry)::FLOAT AS caller_lon,
  ST_Distance(
    ct.location::geography,
    ST_SetSRID(ST_Point(victim_lon, victim_lat), 4326)::geography
  ) / 1000 AS distance_km,
  ct.cell_id AS cell_tower_id,
  ct.name AS tower_name
FROM cell_towers ct
WHERE ST_DWithin(
    ct.location::geography,
    ST_SetSRID(ST_Point(victim_lon, victim_lat), 4326)::geography,
    search_range_km * 1000
  )
ORDER BY distance_km;
END;
$$ LANGUAGE plpgsql;
-- ============================================
-- HELPER: Calculate distance between two points
-- ============================================
CREATE OR REPLACE FUNCTION calculate_distance_km(
    lat1 FLOAT,
    lon1 FLOAT,
    lat2 FLOAT,
    lon2 FLOAT
  ) RETURNS FLOAT AS $$ BEGIN RETURN ST_Distance(
    ST_SetSRID(ST_Point(lon1, lat1), 4326)::geography,
    ST_SetSRID(ST_Point(lon2, lat2), 4326)::geography
  ) / 1000;
END;
$$ LANGUAGE plpgsql;
-- ============================================
-- HELPER: Check if point is within range of tower
-- ============================================
CREATE OR REPLACE FUNCTION is_within_tower_range(
    point_lat FLOAT,
    point_lon FLOAT,
    tower_cell_id TEXT
  ) RETURNS BOOLEAN AS $$
DECLARE tower_range_m FLOAT;
distance_m FLOAT;
BEGIN -- Get tower range
SELECT COALESCE(range_km, 2.0) * 1000 INTO tower_range_m
FROM cell_towers
WHERE cell_id = tower_cell_id;
IF tower_range_m IS NULL THEN RETURN FALSE;
END IF;
-- Calculate distance
SELECT ST_Distance(
    ST_SetSRID(ST_Point(point_lon, point_lat), 4326)::geography,
    location::geography
  ) INTO distance_m
FROM cell_towers
WHERE cell_id = tower_cell_id;
RETURN distance_m <= tower_range_m;
END;
$$ LANGUAGE plpgsql;
-- ============================================
-- SAMPLE USAGE (for testing)
-- ============================================
-- Test triangulation with sample towers
-- SELECT * FROM triangulate_position(
--   ARRAY['DL-000014', 'DL-000025', 'DL-000020']
-- );
-- Test range filtering
-- SELECT * FROM get_callers_in_range(
--   28.735615,  -- victim lat
--   77.222674,  -- victim lon
--   5.0         -- 5km range
-- );
-- Test distance calculation
-- SELECT calculate_distance_km(28.735615, 77.222674, 28.663886, 77.153741);