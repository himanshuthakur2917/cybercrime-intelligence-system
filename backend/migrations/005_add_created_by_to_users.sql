-- =====================================================
-- Add created_by column to users table
-- Tracks which admin created each user
-- =====================================================
-- Add created_by column (nullable for existing users)
ALTER TABLE users
ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES users(id);
-- Create index for faster admin queries
CREATE INDEX IF NOT EXISTS idx_users_created_by ON users(created_by);
-- =====================================================
-- Example Queries
-- =====================================================
-- Admin fetches all users they created:
-- SELECT * FROM users WHERE created_by = '<admin_user_id>';
-- Admin fetches all officers they created:
-- SELECT u.*, o.badge_number, o.department 
-- FROM users u 
-- JOIN officers o ON u.id = o.id 
-- WHERE u.created_by = '<admin_user_id>' AND u.role = 'officer';