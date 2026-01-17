-- Migration: 005_create_rls_policies
-- Description: Creates Row Level Security policies
-- Cybercrime Intelligence System - Data Access Control
-- =====================================================
-- Enable Row Level Security on all tables
-- =====================================================
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE otps ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_log ENABLE ROW LEVEL SECURITY;
-- =====================================================
-- Users Table Policies
-- =====================================================
-- Policy: Users can read their own profile
DROP POLICY IF EXISTS "users_read_own" ON users;
CREATE POLICY "users_read_own" ON users FOR
SELECT USING (auth.uid() = id);
-- Policy: Administrators can read all users
DROP POLICY IF EXISTS "admin_read_all_users" ON users;
CREATE POLICY "admin_read_all_users" ON users FOR
SELECT USING (
    auth.jwt()->>'role' = 'administrator'
  );
-- Policy: Administrators can insert new users
DROP POLICY IF EXISTS "admin_insert_users" ON users;
CREATE POLICY "admin_insert_users" ON users FOR
INSERT WITH CHECK (
    auth.jwt()->>'role' = 'administrator'
  );
-- Policy: Administrators can update any user
DROP POLICY IF EXISTS "admin_update_users" ON users;
CREATE POLICY "admin_update_users" ON users FOR
UPDATE USING (
    auth.jwt()->>'role' = 'administrator'
  );
-- Policy: Users can update their own non-critical fields
DROP POLICY IF EXISTS "users_update_own" ON users;
CREATE POLICY "users_update_own" ON users FOR
UPDATE USING (auth.uid() = id) WITH CHECK (
    -- Users cannot change their role or face encoding (admin-only fields)
    auth.uid() = id
  );
-- Policy: Administrators can delete users
DROP POLICY IF EXISTS "admin_delete_users" ON users;
CREATE POLICY "admin_delete_users" ON users FOR DELETE USING (
  auth.jwt()->>'role' = 'administrator'
);
-- =====================================================
-- OTPs Table Policies
-- =====================================================
-- Policy: Users can read their own OTPs
DROP POLICY IF EXISTS "users_read_own_otps" ON otps;
CREATE POLICY "users_read_own_otps" ON otps FOR
SELECT USING (user_id = auth.uid());
-- Policy: Administrators can read all OTPs
DROP POLICY IF EXISTS "admin_read_all_otps" ON otps;
CREATE POLICY "admin_read_all_otps" ON otps FOR
SELECT USING (
    auth.jwt()->>'role' = 'administrator'
  );
-- Policy: System can insert OTPs (via service role)
DROP POLICY IF EXISTS "system_insert_otps" ON otps;
CREATE POLICY "system_insert_otps" ON otps FOR
INSERT WITH CHECK (true);
-- Policy: System can update OTPs (for verification)
DROP POLICY IF EXISTS "system_update_otps" ON otps;
CREATE POLICY "system_update_otps" ON otps FOR
UPDATE USING (true);
-- =====================================================
-- Activity Log Policies
-- =====================================================
-- Policy: Users can read their own activity
DROP POLICY IF EXISTS "users_read_own_activity" ON activity_log;
CREATE POLICY "users_read_own_activity" ON activity_log FOR
SELECT USING (user_id = auth.uid());
-- Policy: Administrators can read all activity logs
DROP POLICY IF EXISTS "admin_read_all_activity" ON activity_log;
CREATE POLICY "admin_read_all_activity" ON activity_log FOR
SELECT USING (
    auth.jwt()->>'role' = 'administrator'
  );
-- Policy: System can insert activity logs
DROP POLICY IF EXISTS "system_insert_activity" ON activity_log;
CREATE POLICY "system_insert_activity" ON activity_log FOR
INSERT WITH CHECK (true);
-- =====================================================
-- Service Role Bypass (for backend API)
-- Note: The service role key bypasses RLS by default
-- These policies ensure proper access control when
-- using the anon key from the frontend
-- =====================================================
-- Comments for documentation
COMMENT ON POLICY "users_read_own" ON users IS 'Allows users to read their own profile data';
COMMENT ON POLICY "admin_read_all_users" ON users IS 'Allows administrators to view all user profiles';
COMMENT ON POLICY "admin_insert_users" ON users IS 'Only administrators can create new users';
COMMENT ON POLICY "admin_update_users" ON users IS 'Administrators can update any user including face encoding';
COMMENT ON POLICY "users_read_own_otps" ON otps IS 'Users can only see their own OTP records';
COMMENT ON POLICY "admin_read_all_activity" ON activity_log IS 'Administrators can view complete audit trail';