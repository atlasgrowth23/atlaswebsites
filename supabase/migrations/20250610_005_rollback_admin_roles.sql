-- Rollback for admin roles migration
-- Rollback: 20250610_005_rollback_admin_roles.sql

-- Remove role from raw_user_meta_data
UPDATE auth.users 
SET raw_user_meta_data = raw_user_meta_data - 'role'
WHERE raw_user_meta_data ? 'role';

-- Drop role column from auth.users
ALTER TABLE auth.users 
DROP COLUMN IF EXISTS role;