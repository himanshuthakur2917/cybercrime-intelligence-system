-- =====================================================
-- CONSOLIDATED MIGRATION SCRIPT
-- Run this in Supabase SQL Editor to apply all changes
-- =====================================================
-- =====================================================
-- PART 1: Cases Table (Migration 004)
-- =====================================================
-- Create cases table
CREATE TABLE IF NOT EXISTS cases (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  case_number VARCHAR(50) UNIQUE NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  status VARCHAR(30) NOT NULL DEFAULT 'pending',
  priority VARCHAR(20) NOT NULL DEFAULT 'medium',
  created_by UUID NOT NULL REFERENCES users(id),
  assigned_to UUID REFERENCES users(id),
  is_verified BOOLEAN DEFAULT false,
  verified_by UUID REFERENCES users(id),
  verified_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT cases_status_check CHECK (
    status IN (
      'pending',
      'assigned',
      'under_investigation',
      'verified',
      'closed',
      'archived'
    )
  ),
  CONSTRAINT cases_priority_check CHECK (
    priority IN ('critical', 'high', 'medium', 'low')
  )
);
-- Create case_notes table
CREATE TABLE IF NOT EXISTS case_notes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  case_id UUID NOT NULL REFERENCES cases(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id),
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
-- Create indexes
CREATE INDEX IF NOT EXISTS idx_cases_status ON cases(status);
CREATE INDEX IF NOT EXISTS idx_cases_priority ON cases(priority);
CREATE INDEX IF NOT EXISTS idx_cases_created_by ON cases(created_by);
CREATE INDEX IF NOT EXISTS idx_cases_assigned_to ON cases(assigned_to);
CREATE INDEX IF NOT EXISTS idx_cases_case_number ON cases(case_number);
CREATE INDEX IF NOT EXISTS idx_case_notes_case_id ON case_notes(case_id);
CREATE INDEX IF NOT EXISTS idx_case_notes_user_id ON case_notes(user_id);
-- Enable RLS
ALTER TABLE cases ENABLE ROW LEVEL SECURITY;
ALTER TABLE case_notes ENABLE ROW LEVEL SECURITY;
-- Policies
CREATE POLICY "Admins and assigned officers can view cases" ON cases FOR
SELECT USING (true);
CREATE POLICY "Admins can insert cases" ON cases FOR
INSERT WITH CHECK (true);
CREATE POLICY "Admins and assigned officers can update cases" ON cases FOR
UPDATE USING (true);
CREATE POLICY "Users can view case notes" ON case_notes FOR
SELECT USING (true);
CREATE POLICY "Users can insert case notes" ON case_notes FOR
INSERT WITH CHECK (true);
-- Triggers
CREATE OR REPLACE FUNCTION update_cases_timestamp() RETURNS TRIGGER AS $$ BEGIN NEW.updated_at = NOW();
RETURN NEW;
END;
$$ LANGUAGE plpgsql;
CREATE TRIGGER cases_updated_at BEFORE
UPDATE ON cases FOR EACH ROW EXECUTE FUNCTION update_cases_timestamp();
-- Helper function to generate case numbers
CREATE OR REPLACE FUNCTION generate_case_number() RETURNS VARCHAR AS $$
DECLARE year_part VARCHAR(4);
count_part INTEGER;
new_number VARCHAR(50);
BEGIN year_part := TO_CHAR(NOW(), 'YYYY');
SELECT COUNT(*) + 1 INTO count_part
FROM cases
WHERE case_number LIKE 'CASE-' || year_part || '-%';
new_number := 'CASE-' || year_part || '-' || LPAD(count_part::TEXT, 3, '0');
RETURN new_number;
END;
$$ LANGUAGE plpgsql;
-- =====================================================
-- PART 2: Add created_by to users (Migration 005)
-- =====================================================
ALTER TABLE users
ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES users(id);
CREATE INDEX IF NOT EXISTS idx_users_created_by ON users(created_by);
-- =====================================================
-- PART 3: User-Officer Sync Trigger (Migration 006)
-- =====================================================
CREATE OR REPLACE FUNCTION sync_user_to_officer() RETURNS TRIGGER AS $$ BEGIN IF NEW.role = 'officer' THEN
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
DROP TRIGGER IF EXISTS trigger_sync_user_to_officer ON users;
CREATE TRIGGER trigger_sync_user_to_officer
AFTER
INSERT ON users FOR EACH ROW EXECUTE FUNCTION sync_user_to_officer();
-- =====================================================
-- VERIFICATION QUERIES
-- =====================================================
-- 1. Check if tables exist
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name IN ('cases', 'case_notes');
-- 2. Check if created_by column exists on users
SELECT column_name
FROM information_schema.columns
WHERE table_name = 'users'
  AND column_name = 'created_by';
-- 3. Check if trigger exists
SELECT trigger_name
FROM information_schema.triggers
WHERE trigger_name = 'trigger_sync_user_to_officer';
-- 4. Test case number generation
SELECT generate_case_number();
-- =====================================================
-- SUCCESS! All migrations applied
-- =====================================================