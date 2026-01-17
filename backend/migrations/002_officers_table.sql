-- =====================================================
-- Officers Management Table for Supabase
-- Run this in Supabase SQL Editor
-- =====================================================
-- Create officers table
CREATE TABLE IF NOT EXISTS officers (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  badge_number VARCHAR(50) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  phone VARCHAR(20),
  rank VARCHAR(100) NOT NULL DEFAULT 'Constable',
  department VARCHAR(255) NOT NULL DEFAULT 'Cyber Crime',
  station VARCHAR(255),
  -- Status: ACTIVE, INACTIVE, SUSPENDED, RETIRED
  status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
  -- Role: ADMIN, SENIOR_OFFICER, OFFICER, TRAINEE
  role VARCHAR(50) NOT NULL DEFAULT 'OFFICER',
  -- Authentication (optional - can use Supabase Auth)
  password_hash VARCHAR(255),
  -- Permissions (JSON array of permission strings)
  permissions JSONB DEFAULT '["view_cases", "upload_data"]'::jsonb,
  -- Assignment tracking
  current_cases_count INTEGER DEFAULT 0,
  max_cases_allowed INTEGER DEFAULT 10,
  -- Metadata
  joined_date DATE DEFAULT CURRENT_DATE,
  last_login TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID,
  deactivated_at TIMESTAMPTZ,
  deactivation_reason TEXT
);
-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_officers_status ON officers(status);
CREATE INDEX IF NOT EXISTS idx_officers_badge ON officers(badge_number);
CREATE INDEX IF NOT EXISTS idx_officers_email ON officers(email);
CREATE INDEX IF NOT EXISTS idx_officers_role ON officers(role);
-- Enable Row Level Security
ALTER TABLE officers ENABLE ROW LEVEL SECURITY;
-- Policy: Admins can do everything
CREATE POLICY "Admins have full access" ON officers FOR ALL USING (true) WITH CHECK (true);
-- Trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_officers_timestamp() RETURNS TRIGGER AS $$ BEGIN NEW.updated_at = NOW();
RETURN NEW;
END;
$$ LANGUAGE plpgsql;
CREATE TRIGGER officers_updated_at BEFORE
UPDATE ON officers FOR EACH ROW EXECUTE FUNCTION update_officers_timestamp();
-- =====================================================
-- Sample Officers Data (Optional)
-- =====================================================
INSERT INTO officers (
    badge_number,
    name,
    email,
    phone,
    rank,
    department,
    station,
    role,
    permissions
  )
VALUES (
    'ADM001',
    'Superintendent Rajesh Kumar',
    'rajesh.kumar@cyberpolice.gov.in',
    '9876543210',
    'Superintendent',
    'Cyber Crime HQ',
    'Central Delhi',
    'ADMIN',
    '["view_cases", "upload_data", "manage_officers", "assign_cases", "view_analytics", "export_data"]'
  ),
  (
    'OFF001',
    'SI Rakesh Sharma',
    'rakesh.sharma@cyberpolice.gov.in',
    '9876543211',
    'Sub Inspector',
    'Cyber Crime',
    'South District',
    'SENIOR_OFFICER',
    '["view_cases", "upload_data", "assign_cases", "view_analytics"]'
  ),
  (
    'OFF002',
    'ASI Priya Patel',
    'priya.patel@cyberpolice.gov.in',
    '9876543212',
    'Assistant Sub Inspector',
    'Cyber Crime',
    'North District',
    'OFFICER',
    '["view_cases", "upload_data"]'
  ),
  (
    'OFF003',
    'Constable Amit Singh',
    'amit.singh@cyberpolice.gov.in',
    '9876543213',
    'Constable',
    'Cyber Crime',
    'East District',
    'TRAINEE',
    '["view_cases"]'
  ) ON CONFLICT (badge_number) DO NOTHING;
-- =====================================================
-- Useful Queries for Officer Management
-- =====================================================
-- Get all active officers
-- SELECT * FROM officers WHERE status = 'ACTIVE' ORDER BY rank, name;
-- Deactivate an officer
-- UPDATE officers SET status = 'INACTIVE', deactivated_at = NOW(), deactivation_reason = 'Transferred' WHERE badge_number = 'OFF003';
-- Get officer workload
-- SELECT name, badge_number, current_cases_count, max_cases_allowed FROM officers WHERE status = 'ACTIVE' ORDER BY current_cases_count DESC;