-- ============================================
-- Helper RPC Function to Insert Cell Towers
-- Optimized batch insert for PostGIS
-- ============================================
CREATE OR REPLACE FUNCTION insert_cell_towers(towers_data JSONB []) RETURNS void AS $$
DECLARE tower_record JSONB;
lon FLOAT;
lat FLOAT;
BEGIN FOREACH tower_record IN ARRAY towers_data LOOP -- Extract lon/lat from POINT string format
-- Format: "POINT(lon lat)"
lon := CAST(
  split_part(
    split_part(tower_record->>'location', '(', 2),
    ' ',
    1
  ) AS FLOAT
);
lat := CAST(
  split_part(
    split_part(
      split_part(tower_record->>'location', ' ', 2),
      ')',
      1
    ),
    ' ',
    1
  ) AS FLOAT
);
-- Insert with PostGIS GEOGRAPHY type
INSERT INTO cell_towers (cell_id, name, location, range_km)
VALUES (
    tower_record->>'cell_id',
    tower_record->>'name',
    ST_SetSRID(ST_Point(lon, lat), 4326)::geography,
    CAST(tower_record->>'range_km' AS FLOAT)
  ) ON CONFLICT (cell_id) DO NOTHING;
END LOOP;
END;
$$ LANGUAGE plpgsql;
-- Grant execute permission
GRANT EXECUTE ON FUNCTION insert_cell_towers TO authenticated,
  anon,
  service_role;
-- ============================================
-- RPC: Get All Cell Towers with Coordinates
-- Extracts lat/lon from PostGIS geography
-- LIMITED to prevent loading all 850k at once
-- ============================================
CREATE OR REPLACE FUNCTION get_all_towers_with_coords() RETURNS TABLE(
    cell_id TEXT,
    name TEXT,
    lat FLOAT,
    lon FLOAT,
    range_km FLOAT
  ) AS $$ BEGIN RETURN QUERY
SELECT ct.cell_id,
  ct.name,
  ST_Y(ct.location::geometry)::FLOAT AS lat,
  ST_X(ct.location::geometry)::FLOAT AS lon,
  ct.range_km
FROM cell_towers ct
ORDER BY ct.cell_id
LIMIT 10000;
-- Only return 10k towers for initial map load
END;
$$ LANGUAGE plpgsql;
-- Grant execute permission
GRANT EXECUTE ON FUNCTION get_all_towers_with_coords TO authenticated,
  anon,
  service_role;
-- ============================================
-- RPC: Get Cell Towers within Bounding Box
-- For efficient viewport-based loading
-- ============================================
CREATE OR REPLACE FUNCTION get_towers_in_bounds(
    min_lat FLOAT,
    min_lon FLOAT,
    max_lat FLOAT,
    max_lon FLOAT
  ) RETURNS TABLE(
    cell_id TEXT,
    name TEXT,
    lat FLOAT,
    lon FLOAT,
    range_km FLOAT
  ) AS $$ BEGIN RETURN QUERY
SELECT ct.cell_id,
  ct.name,
  ST_Y(ct.location::geometry)::FLOAT AS lat,
  ST_X(ct.location::geometry)::FLOAT AS lon,
  ct.range_km
FROM cell_towers ct
WHERE ST_Intersects(
    ct.location::geometry,
    ST_MakeEnvelope(min_lon, min_lat, max_lon, max_lat, 4326)
  )
LIMIT 5000;
-- Limit to 5k towers per viewport
END;
$$ LANGUAGE plpgsql;
-- Grant execute permission
GRANT EXECUTE ON FUNCTION get_towers_in_bounds TO authenticated,
  anon,
  service_role;