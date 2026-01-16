-- =====================================================
-- Cybercrime Intelligence System - Complete Migration Script
-- =====================================================
-- This script combines all migrations for easy execution
-- Run this file to set up the complete database schema
-- =====================================================
-- Start transaction
BEGIN;
-- =====================================================
-- 001: Create Users Table
-- =====================================================
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  -- Core user fields
  username VARCHAR(50) UNIQUE NOT NULL,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(120) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  phone VARCHAR(15) UNIQUE NOT NULL,
  -- Role: officer or administrator
  role VARCHAR(20) NOT NULL CHECK (role IN ('officer', 'administrator')),
  -- Account status
  is_active BOOLEAN DEFAULT TRUE,
  -- Face Recognition related fields (managed by administrator)
  face_encoding BYTEA,
  face_registered BOOLEAN DEFAULT FALSE,
  face_registered_at TIMESTAMP WITH TIME ZONE,
  -- Employee information (set by administrator)
  employee_id VARCHAR(50),
  department VARCHAR(100),
  designation VARCHAR(100),
  profile_image_url VARCHAR(500),
  -- Login tracking
  last_login TIMESTAMP WITH TIME ZONE,
  -- OTP verification status for current session
  otp_verified BOOLEAN DEFAULT FALSE,
  face_verified BOOLEAN DEFAULT FALSE,
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  -- Validation constraints
  CONSTRAINT username_length CHECK (length(username) >= 3),
  CONSTRAINT password_length CHECK (length(password) >= 6),
  CONSTRAINT email_format CHECK (
    email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}$'
  ),
  CONSTRAINT phone_format CHECK (phone ~* '^\+?[0-9]{10,15}$')
);
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_phone ON users(phone);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_users_is_active ON users(is_active);
CREATE INDEX IF NOT EXISTS idx_users_created_at ON users(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_users_face_registered ON users(face_registered);
COMMENT ON TABLE users IS 'Stores user account information for Cybercrime Intelligence System (officers and administrators)';
-- =====================================================
-- 002: Create OTPs Table
-- =====================================================
CREATE TABLE IF NOT EXISTS otps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  -- User reference
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  phone VARCHAR(15) NOT NULL,
  -- OTP details
  otp_code VARCHAR(6) NOT NULL,
  is_verified BOOLEAN DEFAULT FALSE,
  -- Security tracking
  attempts INTEGER DEFAULT 0,
  max_attempts INTEGER DEFAULT 3,
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  verified_at TIMESTAMP WITH TIME ZONE,
  -- Validation constraints
  CONSTRAINT otp_length CHECK (length(otp_code) = 6),
  CONSTRAINT otp_phone_format CHECK (phone ~* '^\+?[0-9]{10,15}$'),
  CONSTRAINT max_attempts_limit CHECK (attempts <= max_attempts)
);
CREATE INDEX IF NOT EXISTS idx_otps_user_id ON otps(user_id);
CREATE INDEX IF NOT EXISTS idx_otps_phone ON otps(phone);
CREATE INDEX IF NOT EXISTS idx_otps_is_verified ON otps(is_verified);
CREATE INDEX IF NOT EXISTS idx_otps_created_at ON otps(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_otps_expires_at ON otps(expires_at);
CREATE INDEX IF NOT EXISTS idx_otps_phone_created_at ON otps(phone, created_at DESC);
COMMENT ON TABLE otps IS 'Stores OTP records for phone-based authentication in login flow';
-- =====================================================
-- 003: Create Activity Log Table
-- =====================================================
CREATE TABLE IF NOT EXISTS activity_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  -- User reference (nullable if action is system-generated)
  user_id UUID REFERENCES users(id) ON DELETE
  SET NULL,
    -- Action details
    action VARCHAR(100) NOT NULL,
    action_type VARCHAR(50) NOT NULL,
    -- Additional details stored as JSON
    details JSONB,
    -- Request metadata
    ip_address VARCHAR(45),
    user_agent TEXT,
    -- Session tracking
    session_id VARCHAR(100),
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_activity_user_id ON activity_log(user_id);
CREATE INDEX IF NOT EXISTS idx_activity_created_at ON activity_log(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_activity_action_type ON activity_log(action_type);
CREATE INDEX IF NOT EXISTS idx_activity_action ON activity_log(action);
CREATE INDEX IF NOT EXISTS idx_activity_session_id ON activity_log(session_id);
CREATE INDEX IF NOT EXISTS idx_activity_details ON activity_log USING GIN (details);
COMMENT ON TABLE activity_log IS 'Audit trail for all system activities in Cybercrime Intelligence System';
-- =====================================================
-- 004: Create Triggers and Functions
-- =====================================================
-- Function: Update updated_at timestamp automatically
CREATE OR REPLACE FUNCTION update_updated_at_column() RETURNS TRIGGER AS $$ BEGIN NEW.updated_at = NOW();
RETURN NEW;
END;
$$ LANGUAGE plpgsql;
DROP TRIGGER IF EXISTS users_updated_at_trigger ON users;
CREATE TRIGGER users_updated_at_trigger BEFORE
UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
-- Function: Log user activity
CREATE OR REPLACE FUNCTION log_user_activity(
    p_user_id UUID,
    p_action VARCHAR(100),
    p_action_type VARCHAR(50),
    p_details JSONB DEFAULT NULL,
    p_ip_address VARCHAR(45) DEFAULT NULL,
    p_user_agent TEXT DEFAULT NULL,
    p_session_id VARCHAR(100) DEFAULT NULL
  ) RETURNS UUID AS $$
DECLARE new_log_id UUID;
BEGIN
INSERT INTO activity_log (
    user_id,
    action,
    action_type,
    details,
    ip_address,
    user_agent,
    session_id
  )
VALUES (
    p_user_id,
    p_action,
    p_action_type,
    p_details,
    p_ip_address,
    p_user_agent,
    p_session_id
  )
RETURNING id INTO new_log_id;
RETURN new_log_id;
END;
$$ LANGUAGE plpgsql;
-- Function: Cleanup expired OTPs
CREATE OR REPLACE FUNCTION cleanup_expired_otps() RETURNS INTEGER AS $$
DECLARE deleted_count INTEGER;
BEGIN
DELETE FROM otps
WHERE expires_at < NOW()
  AND is_verified = FALSE;
GET DIAGNOSTICS deleted_count = ROW_COUNT;
RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;
-- Function: Generate OTP for user
CREATE OR REPLACE FUNCTION generate_otp(
    p_user_id UUID,
    p_phone VARCHAR(15),
    p_expiry_minutes INTEGER DEFAULT 5
  ) RETURNS TABLE (
    otp_id UUID,
    otp_code VARCHAR(6),
    expires_at TIMESTAMP WITH TIME ZONE
  ) AS $$
DECLARE new_otp_code VARCHAR(6);
new_expires_at TIMESTAMP WITH TIME ZONE;
new_otp_id UUID;
BEGIN new_otp_code := LPAD(FLOOR(RANDOM() * 1000000)::TEXT, 6, '0');
new_expires_at := NOW() + (p_expiry_minutes || ' minutes')::INTERVAL;
UPDATE otps
SET is_verified = TRUE
WHERE user_id = p_user_id
  AND is_verified = FALSE;
INSERT INTO otps (user_id, phone, otp_code, expires_at)
VALUES (p_user_id, p_phone, new_otp_code, new_expires_at)
RETURNING id INTO new_otp_id;
RETURN QUERY
SELECT new_otp_id,
  new_otp_code,
  new_expires_at;
END;
$$ LANGUAGE plpgsql;
-- Function: Verify OTP
CREATE OR REPLACE FUNCTION verify_otp(p_user_id UUID, p_otp_code VARCHAR(6)) RETURNS TABLE (success BOOLEAN, message TEXT) AS $$
DECLARE otp_record RECORD;
BEGIN
SELECT * INTO otp_record
FROM otps
WHERE user_id = p_user_id
  AND is_verified = FALSE
  AND expires_at > NOW()
ORDER BY created_at DESC
LIMIT 1;
IF otp_record IS NULL THEN RETURN QUERY
SELECT FALSE,
  'No valid OTP found or OTP has expired';
RETURN;
END IF;
IF otp_record.attempts >= otp_record.max_attempts THEN RETURN QUERY
SELECT FALSE,
  'Maximum verification attempts exceeded';
RETURN;
END IF;
IF otp_record.otp_code = p_otp_code THEN
UPDATE otps
SET is_verified = TRUE,
  verified_at = NOW()
WHERE id = otp_record.id;
UPDATE users
SET otp_verified = TRUE
WHERE id = p_user_id;
RETURN QUERY
SELECT TRUE,
  'OTP verified successfully';
ELSE
UPDATE otps
SET attempts = attempts + 1
WHERE id = otp_record.id;
RETURN QUERY
SELECT FALSE,
  'Invalid OTP code';
END IF;
END;
$$ LANGUAGE plpgsql;
-- Function: Reset user verification status
CREATE OR REPLACE FUNCTION reset_user_verification(p_user_id UUID) RETURNS VOID AS $$ BEGIN
UPDATE users
SET otp_verified = FALSE,
  face_verified = FALSE
WHERE id = p_user_id;
END;
$$ LANGUAGE plpgsql;
-- Function: Update last login timestamp
CREATE OR REPLACE FUNCTION update_last_login(p_user_id UUID) RETURNS VOID AS $$ BEGIN
UPDATE users
SET last_login = NOW()
WHERE id = p_user_id;
END;
$$ LANGUAGE plpgsql;
-- =====================================================
-- 005: Enable RLS and Create Policies
-- =====================================================
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE otps ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_log ENABLE ROW LEVEL SECURITY;
-- Users Table Policies
DROP POLICY IF EXISTS "users_read_own" ON users;
CREATE POLICY "users_read_own" ON users FOR
SELECT USING (auth.uid() = id);
DROP POLICY IF EXISTS "admin_read_all_users" ON users;
CREATE POLICY "admin_read_all_users" ON users FOR
SELECT USING (auth.jwt()->>'role' = 'administrator');
DROP POLICY IF EXISTS "admin_insert_users" ON users;
CREATE POLICY "admin_insert_users" ON users FOR
INSERT WITH CHECK (auth.jwt()->>'role' = 'administrator');
DROP POLICY IF EXISTS "admin_update_users" ON users;
CREATE POLICY "admin_update_users" ON users FOR
UPDATE USING (auth.jwt()->>'role' = 'administrator');
DROP POLICY IF EXISTS "users_update_own" ON users;
CREATE POLICY "users_update_own" ON users FOR
UPDATE USING (auth.uid() = id);
DROP POLICY IF EXISTS "admin_delete_users" ON users;
CREATE POLICY "admin_delete_users" ON users FOR DELETE USING (auth.jwt()->>'role' = 'administrator');
-- OTPs Table Policies
DROP POLICY IF EXISTS "users_read_own_otps" ON otps;
CREATE POLICY "users_read_own_otps" ON otps FOR
SELECT USING (user_id = auth.uid());
DROP POLICY IF EXISTS "admin_read_all_otps" ON otps;
CREATE POLICY "admin_read_all_otps" ON otps FOR
SELECT USING (auth.jwt()->>'role' = 'administrator');
DROP POLICY IF EXISTS "system_insert_otps" ON otps;
CREATE POLICY "system_insert_otps" ON otps FOR
INSERT WITH CHECK (true);
DROP POLICY IF EXISTS "system_update_otps" ON otps;
CREATE POLICY "system_update_otps" ON otps FOR
UPDATE USING (true);
-- Activity Log Policies
DROP POLICY IF EXISTS "users_read_own_activity" ON activity_log;
CREATE POLICY "users_read_own_activity" ON activity_log FOR
SELECT USING (user_id = auth.uid());
DROP POLICY IF EXISTS "admin_read_all_activity" ON activity_log;
CREATE POLICY "admin_read_all_activity" ON activity_log FOR
SELECT USING (auth.jwt()->>'role' = 'administrator');
DROP POLICY IF EXISTS "system_insert_activity" ON activity_log;
CREATE POLICY "system_insert_activity" ON activity_log FOR
INSERT WITH CHECK (true);
-- Commit transaction
COMMIT;
-- =====================================================
-- Migration Complete!
-- =====================================================
-- Tables created:
--   - users (officers and administrators)
--   - otps (phone verification)
--   - activity_log (audit trail)
--
-- Functions created:
--   - update_updated_at_column()
--   - log_user_activity()
--   - cleanup_expired_otps()
--   - generate_otp()
--   - verify_otp()
--   - reset_user_verification()
--   - update_last_login()
--
-- RLS policies configured for role-based access
-- =====================================================