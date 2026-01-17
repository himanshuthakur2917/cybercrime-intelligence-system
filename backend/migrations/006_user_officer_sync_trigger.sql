-- =====================================================
-- User-Officer Sync Trigger
-- Auto-creates officer record when user with role='officer' is inserted
-- =====================================================
-- Trigger function to sync user to officer
CREATE OR REPLACE FUNCTION sync_user_to_officer() RETURNS TRIGGER AS $$ BEGIN -- Only create officer if role is 'officer'
  IF NEW.role = 'officer' THEN
INSERT INTO officers (
    id,
    badge_number,
    name,
    email,
    phone,
    rank,
    department,
    station,
    role,
    created_by,
    created_at,
    updated_at
  )
VALUES (
    NEW.id,
    'CIS-' || SUBSTRING(REPLACE(NEW.id::text, '-', ''), 1, 8),
    NEW.name,
    NEW.email,
    NEW.phone,
    'Constable',
    COALESCE(NEW.department, 'Cyber Crime'),
    NULL,
    'OFFICER',
    NEW.created_by,
    NEW.created_at,
    NEW.updated_at
  ) ON CONFLICT (id) DO NOTHING;
END IF;
RETURN NEW;
END;
$$ LANGUAGE plpgsql;
-- Create trigger on users table
DROP TRIGGER IF EXISTS trigger_sync_user_to_officer ON users;
CREATE TRIGGER trigger_sync_user_to_officer
AFTER
INSERT ON users FOR EACH ROW EXECUTE FUNCTION sync_user_to_officer();
-- =====================================================
-- Example Usage
-- =====================================================
-- When admin creates an officer user:
-- INSERT INTO users (username, name, email, password, phone, role, department, created_by)
-- VALUES ('officer1', 'Officer One', 'officer1@cis.gov.in', 
--         '$2b$10$hash', '+919876543201', 'officer', 'Cyber Unit', '<admin_user_id>');
-- 
-- This automatically creates:
-- - Entry in users table
-- - Entry in officers table with badge_number 'CIS-xxxxxxxx' and created_by = '<admin_user_id>'
-- Admin can query their officers:
-- SELECT * FROM officers WHERE created_by = '<admin_user_id>';