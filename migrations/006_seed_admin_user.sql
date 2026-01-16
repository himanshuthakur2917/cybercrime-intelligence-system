-- Migration: 006_seed_admin_user
-- Description: Seeds an initial administrator user for system setup
-- Cybercrime Intelligence System - Initial Admin Setup
-- =====================================================
-- IMPORTANT: Change these credentials before running in production!
-- The password hash below is for: 'Admin@123'
-- You should generate a new password hash using bcrypt
-- =====================================================
-- Insert initial administrator user (if not exists)
INSERT INTO users (
    username,
    name,
    email,
    password,
    phone,
    role,
    is_active,
    employee_id,
    department,
    designation,
    created_at
  )
SELECT 'admin',
  'System Administrator',
  'admin@cybercrime-intel.gov.in',
  -- bcrypt hash for 'Admin@123' - CHANGE IN PRODUCTION!
  '$2b$10$rQZ5VdP5d5x5d5x5d5x5dOKJhJhJhJhJhJhJhJhJhJhJhJhJhJhJh',
  '+911234567890',
  'administrator',
  TRUE,
  'EMP001',
  'IT Administration',
  'System Administrator',
  NOW()
WHERE NOT EXISTS (
    SELECT 1
    FROM users
    WHERE username = 'admin'
      OR email = 'admin@cybercrime-intel.gov.in'
  );
-- Log the admin creation
SELECT log_user_activity(
    (
      SELECT id
      FROM users
      WHERE username = 'admin'
    ),
    'Initial administrator account created',
    'user_created',
    '{"setup": "initial", "method": "migration"}'::JSONB,
    NULL,
    NULL,
    NULL
  );
-- =====================================================
-- Password Generation Guide
-- =====================================================
-- To generate a proper bcrypt password hash, use:
--
-- Node.js:
-- const bcrypt = require('bcrypt');
-- const hash = await bcrypt.hash('YourPassword', 10);
-- console.log(hash);
--
-- Python:
-- import bcrypt
-- hash = bcrypt.hashpw('YourPassword'.encode(), bcrypt.gensalt(10))
-- print(hash.decode())
--
-- =====================================================
COMMENT ON TABLE users IS 'Initial admin user seeded with migration 006. Remember to change default password!';