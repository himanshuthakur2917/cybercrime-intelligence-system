-- Migration: 002_create_otps_table
-- Description: Creates the OTPs table for phone-based authentication
-- Cybercrime Intelligence System - OTP Verification System
-- Create otps table if it does not exist
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
  CONSTRAINT phone_format CHECK (phone ~* '^\+?[0-9]{10,15}$'),
  CONSTRAINT max_attempts_limit CHECK (attempts <= max_attempts)
);
-- Create indexes on otps table for optimized queries
CREATE INDEX IF NOT EXISTS idx_otps_user_id ON otps(user_id);
CREATE INDEX IF NOT EXISTS idx_otps_phone ON otps(phone);
CREATE INDEX IF NOT EXISTS idx_otps_is_verified ON otps(is_verified);
CREATE INDEX IF NOT EXISTS idx_otps_created_at ON otps(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_otps_expires_at ON otps(expires_at);
-- Composite index for common query pattern (find latest OTP for phone)
CREATE INDEX IF NOT EXISTS idx_otps_phone_created_at ON otps(phone, created_at DESC);
-- Comments for documentation
COMMENT ON TABLE otps IS 'Stores OTP records for phone-based authentication in login flow';
COMMENT ON COLUMN otps.user_id IS 'Reference to the user requesting OTP verification';
COMMENT ON COLUMN otps.attempts IS 'Number of OTP verification attempts made';
COMMENT ON COLUMN otps.max_attempts IS 'Maximum allowed verification attempts (default 3)';
COMMENT ON COLUMN otps.expires_at IS 'Expiration timestamp for the OTP (typically 5-10 minutes from creation)';
COMMENT ON COLUMN otps.verified_at IS 'Timestamp when OTP was successfully verified';