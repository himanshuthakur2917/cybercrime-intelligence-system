-- Migration: 003_create_activity_log_table
-- Description: Creates the activity log table for audit trail
-- Cybercrime Intelligence System - Activity Logging
-- Create activity_log table if it does not exist
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
-- Create indexes on activity_log table for optimized queries
CREATE INDEX IF NOT EXISTS idx_activity_user_id ON activity_log(user_id);
CREATE INDEX IF NOT EXISTS idx_activity_created_at ON activity_log(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_activity_action_type ON activity_log(action_type);
CREATE INDEX IF NOT EXISTS idx_activity_action ON activity_log(action);
CREATE INDEX IF NOT EXISTS idx_activity_session_id ON activity_log(session_id);
-- GIN index for JSONB details column for efficient JSON queries
CREATE INDEX IF NOT EXISTS idx_activity_details ON activity_log USING GIN (details);
-- Comments for documentation
COMMENT ON TABLE activity_log IS 'Audit trail for all system activities in Cybercrime Intelligence System';
COMMENT ON COLUMN activity_log.action IS 'Human-readable description of the action performed';
COMMENT ON COLUMN activity_log.action_type IS 'Category of action: login, logout, otp_sent, otp_verified, face_verified, user_created, etc.';
COMMENT ON COLUMN activity_log.details IS 'JSON object containing additional context about the action';
COMMENT ON COLUMN activity_log.ip_address IS 'IP address of the request (IPv4 or IPv6)';
COMMENT ON COLUMN activity_log.session_id IS 'Session identifier for correlating related activities';
-- Common action_type values:
-- 'login_attempt' - User attempted to login
-- 'login_success' - User successfully logged in (after all verifications)
-- 'login_failed' - Login failed (wrong credentials)
-- 'otp_sent' - OTP was sent to user's phone
-- 'otp_verified' - OTP was successfully verified
-- 'otp_failed' - OTP verification failed
-- 'face_verified' - Face recognition successfully verified
-- 'face_failed' - Face recognition failed
-- 'user_created' - Administrator created a new user
-- 'user_updated' - User profile was updated
-- 'face_registered' - Administrator registered face encoding for user
-- 'logout' - User logged out