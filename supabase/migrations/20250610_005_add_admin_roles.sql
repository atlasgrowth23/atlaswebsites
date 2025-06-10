-- Add role column to auth.users and set up admin roles
-- Migration: 20250610_005_add_admin_roles.sql

-- Add role column to auth.users table
ALTER TABLE auth.users 
ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'admin';

-- Update Nicholas to super_admin role
UPDATE auth.users 
SET role = 'super_admin' 
WHERE email = 'nicholas@atlasgrowth.ai';

-- Update any other existing users to admin role  
UPDATE auth.users 
SET role = 'admin' 
WHERE role IS NULL OR role = '';

-- Update raw_user_meta_data to include role for JWT claims
UPDATE auth.users 
SET raw_user_meta_data = COALESCE(raw_user_meta_data, '{}'::jsonb) || jsonb_build_object('role', role)
WHERE raw_user_meta_data IS NULL OR NOT raw_user_meta_data ? 'role';