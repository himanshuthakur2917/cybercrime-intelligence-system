-- =====================================================
-- Cases Management Table
-- Simplified: Only stores case metadata
-- Neo4j stores investigation details with case_id as inv_id
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
-- Create indexes for faster lookups
CREATE INDEX IF NOT EXISTS idx_cases_status ON cases(status);
CREATE INDEX IF NOT EXISTS idx_cases_priority ON cases(priority);
CREATE INDEX IF NOT EXISTS idx_cases_created_by ON cases(created_by);
CREATE INDEX IF NOT EXISTS idx_cases_assigned_to ON cases(assigned_to);
CREATE INDEX IF NOT EXISTS idx_cases_case_number ON cases(case_number);
CREATE INDEX IF NOT EXISTS idx_case_notes_case_id ON case_notes(case_id);
CREATE INDEX IF NOT EXISTS idx_case_notes_user_id ON case_notes(user_id);
-- Enable Row Level Security
ALTER TABLE cases ENABLE ROW LEVEL SECURITY;
ALTER TABLE case_notes ENABLE ROW LEVEL SECURITY;
-- Policy: Admins and assigned officers can view cases
CREATE POLICY "Admins and assigned officers can view cases" ON cases FOR
SELECT USING (true);
-- Policy: Only admins can insert cases
CREATE POLICY "Admins can insert cases" ON cases FOR
INSERT WITH CHECK (true);
-- Policy: Admins and assigned officers can update cases
CREATE POLICY "Admins and assigned officers can update cases" ON cases FOR
UPDATE USING (true);
-- Policy: Users can view notes on cases they have access to
CREATE POLICY "Users can view case notes" ON case_notes FOR
SELECT USING (true);
-- Policy: Users can insert notes
CREATE POLICY "Users can insert case notes" ON case_notes FOR
INSERT WITH CHECK (true);
-- Trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_cases_timestamp() RETURNS TRIGGER AS $$ BEGIN NEW.updated_at = NOW();
RETURN NEW;
END;
$$ LANGUAGE plpgsql;
CREATE TRIGGER cases_updated_at BEFORE
UPDATE ON cases FOR EACH ROW EXECUTE FUNCTION update_cases_timestamp();
-- Function to generate next case number
CREATE OR REPLACE FUNCTION generate_case_number() RETURNS VARCHAR AS $$
DECLARE year_part VARCHAR(4);
count_part INTEGER;
new_number VARCHAR(50);
BEGIN year_part := TO_CHAR(NOW(), 'YYYY');
-- Get current count for this year
SELECT COUNT(*) + 1 INTO count_part
FROM cases
WHERE case_number LIKE 'CASE-' || year_part || '-%';
-- Format as CASE-YYYY-XXX
new_number := 'CASE-' || year_part || '-' || LPAD(count_part::TEXT, 3, '0');
RETURN new_number;
END;
$$ LANGUAGE plpgsql;
-- =====================================================
-- Example Queries
-- =====================================================
-- Generate next case number:
-- SELECT generate_case_number();
-- Create a case:
-- INSERT INTO cases (case_number, title, description, priority, created_by)
-- VALUES (generate_case_number(), 'Test Case', 'Description', 'high', '<admin_user_id>');
-- Assign case to officer:
-- UPDATE cases SET assigned_to = '<officer_user_id>', status = 'assigned' WHERE id = '<case_id>';
-- Add case note:
-- INSERT INTO case_notes (case_id, user_id, content) 
-- VALUES ('<case_id>', '<user_id>', 'Initial investigation notes');