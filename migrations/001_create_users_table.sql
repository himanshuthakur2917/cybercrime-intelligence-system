-- Migration: 001_create_users_table
-- Description: Creates the users table for officers and administrators
-- Cybercrime Intelligence System - Authentication Database Schema
-- Create users table if it does not exist
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
-- Create indexes on users table for optimized queries
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_phone ON users(phone);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_users_is_active ON users(is_active);
CREATE INDEX IF NOT EXISTS idx_users_created_at ON users(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_users_face_registered ON users(face_registered);
-- Comments for documentation
COMMENT ON TABLE users IS 'Stores user account information for Cybercrime Intelligence System (officers and administrators)';
COMMENT ON COLUMN users.face_encoding IS 'Binary encoding of user face for recognition (uploaded by administrator)';
COMMENT ON COLUMN users.face_registered IS 'Whether user has face encoding registered by administrator';
COMMENT ON COLUMN users.role IS 'User role: officer (limited access) or administrator (full access)';
COMMENT ON COLUMN users.otp_verified IS 'Whether current login session has passed OTP verification';
COMMENT ON COLUMN users.face_verified IS 'Whether current login session has passed face verification';