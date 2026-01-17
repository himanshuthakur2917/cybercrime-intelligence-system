-- Migration: 004_create_triggers_and_functions
-- Description: Creates database triggers and helper functions
-- Cybercrime Intelligence System - Database Automation
-- =====================================================
-- Function: Update updated_at timestamp automatically
-- =====================================================
CREATE OR REPLACE FUNCTION update_updated_at_column() RETURNS TRIGGER AS $$ BEGIN NEW.updated_at = NOW();
RETURN NEW;
END;
$$ LANGUAGE plpgsql;
COMMENT ON FUNCTION update_updated_at_column IS 'Automatically updates the updated_at timestamp when a row is modified';
-- Trigger for users table
DROP TRIGGER IF EXISTS users_updated_at_trigger ON users;
CREATE TRIGGER users_updated_at_trigger BEFORE
UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
-- =====================================================
-- Function: Log user activity
-- =====================================================
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
COMMENT ON FUNCTION log_user_activity IS 'Helper function to insert activity log entries with all parameters';
-- =====================================================
-- Function: Cleanup expired OTPs
-- =====================================================
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
COMMENT ON FUNCTION cleanup_expired_otps IS 'Removes expired and unverified OTPs from the database';
-- =====================================================
-- Function: Generate OTP for user
-- =====================================================
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
BEGIN -- Generate 6-digit OTP
new_otp_code := LPAD(FLOOR(RANDOM() * 1000000)::TEXT, 6, '0');
new_expires_at := NOW() + (p_expiry_minutes || ' minutes')::INTERVAL;
-- Invalidate any existing unverified OTPs for this user
UPDATE otps
SET is_verified = TRUE
WHERE user_id = p_user_id
  AND is_verified = FALSE;
-- Insert new OTP
INSERT INTO otps (user_id, phone, otp_code, expires_at)
VALUES (p_user_id, p_phone, new_otp_code, new_expires_at)
RETURNING id INTO new_otp_id;
RETURN QUERY
SELECT new_otp_id,
  new_otp_code,
  new_expires_at;
END;
$$ LANGUAGE plpgsql;
COMMENT ON FUNCTION generate_otp IS 'Generates a new 6-digit OTP for a user and returns it along with expiration time';
-- =====================================================
-- Function: Verify OTP
-- =====================================================
CREATE OR REPLACE FUNCTION verify_otp(p_user_id UUID, p_otp_code VARCHAR(6)) RETURNS TABLE (success BOOLEAN, message TEXT) AS $$
DECLARE otp_record RECORD;
BEGIN -- Find the latest unverified OTP for this user
SELECT * INTO otp_record
FROM otps
WHERE user_id = p_user_id
  AND is_verified = FALSE
  AND expires_at > NOW()
ORDER BY created_at DESC
LIMIT 1;
-- Check if OTP exists
IF otp_record IS NULL THEN RETURN QUERY
SELECT FALSE,
  'No valid OTP found or OTP has expired';
RETURN;
END IF;
-- Check if max attempts exceeded
IF otp_record.attempts >= otp_record.max_attempts THEN RETURN QUERY
SELECT FALSE,
  'Maximum verification attempts exceeded';
RETURN;
END IF;
-- Verify OTP code
IF otp_record.otp_code = p_otp_code THEN -- Mark OTP as verified
UPDATE otps
SET is_verified = TRUE,
  verified_at = NOW()
WHERE id = otp_record.id;
-- Update user's OTP verification status
UPDATE users
SET otp_verified = TRUE
WHERE id = p_user_id;
RETURN QUERY
SELECT TRUE,
  'OTP verified successfully';
ELSE -- Increment attempts
UPDATE otps
SET attempts = attempts + 1
WHERE id = otp_record.id;
RETURN QUERY
SELECT FALSE,
  'Invalid OTP code';
END IF;
END;
$$ LANGUAGE plpgsql;
COMMENT ON FUNCTION verify_otp IS 'Verifies an OTP code for a user, handles attempts tracking and expiration';
-- =====================================================
-- Function: Reset user verification status (on logout)
-- =====================================================
CREATE OR REPLACE FUNCTION reset_user_verification(p_user_id UUID) RETURNS VOID AS $$ BEGIN
UPDATE users
SET otp_verified = FALSE,
  face_verified = FALSE
WHERE id = p_user_id;
END;
$$ LANGUAGE plpgsql;
COMMENT ON FUNCTION reset_user_verification IS 'Resets OTP and face verification status when user logs out';
-- =====================================================
-- Function: Update last login timestamp
-- =====================================================
CREATE OR REPLACE FUNCTION update_last_login(p_user_id UUID) RETURNS VOID AS $$ BEGIN
UPDATE users
SET last_login = NOW()
WHERE id = p_user_id;
END;
$$ LANGUAGE plpgsql;
COMMENT ON FUNCTION update_last_login IS 'Updates the last_login timestamp for a user';