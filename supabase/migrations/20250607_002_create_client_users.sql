-- Migration: Create client users table for business owner authentication
-- Date: 2025-06-07
-- Description: Creates users table for business owners to log into their dashboard

-- Table for client user authentication
CREATE TABLE IF NOT EXISTS client_users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    email TEXT NOT NULL UNIQUE,
    name TEXT,
    provider TEXT DEFAULT 'google', -- 'google' or 'magic_link'
    provider_id TEXT, -- Google user ID
    avatar_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_login TIMESTAMP WITH TIME ZONE,
    is_active BOOLEAN DEFAULT true,
    CONSTRAINT client_users_email_unique UNIQUE (email)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_client_users_company_id ON client_users(company_id);
CREATE INDEX IF NOT EXISTS idx_client_users_email ON client_users(email);
CREATE INDEX IF NOT EXISTS idx_client_users_provider_id ON client_users(provider_id);

-- Row Level Security
ALTER TABLE client_users ENABLE ROW LEVEL SECURITY;

-- RLS Policy for client users - users can only see their own record
CREATE POLICY client_users_own_data ON client_users
    FOR ALL TO authenticated
    USING (email = auth.jwt() ->> 'email');

-- Function to get or create client user from companies.email_1
CREATE OR REPLACE FUNCTION get_or_create_client_user(
    user_email TEXT,
    user_name TEXT DEFAULT NULL,
    user_provider TEXT DEFAULT 'google',
    user_provider_id TEXT DEFAULT NULL,
    user_avatar_url TEXT DEFAULT NULL
)
RETURNS client_users AS $$
DECLARE
    result_user client_users;
    target_company companies;
BEGIN
    -- First check if user already exists
    SELECT * INTO result_user FROM client_users WHERE email = user_email;
    
    IF FOUND THEN
        -- Update last login and return existing user
        UPDATE client_users 
        SET 
            last_login = NOW(),
            name = COALESCE(user_name, name),
            avatar_url = COALESCE(user_avatar_url, avatar_url)
        WHERE email = user_email
        RETURNING * INTO result_user;
        
        RETURN result_user;
    END IF;
    
    -- Find company by email_1 field
    SELECT * INTO target_company FROM companies WHERE email_1 = user_email;
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'No company found with email: %', user_email;
    END IF;
    
    -- Create new client user
    INSERT INTO client_users (
        company_id,
        email,
        name,
        provider,
        provider_id,
        avatar_url,
        last_login
    ) VALUES (
        target_company.id,
        user_email,
        user_name,
        user_provider,
        user_provider_id,
        user_avatar_url,
        NOW()
    ) RETURNING * INTO result_user;
    
    RETURN result_user;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;