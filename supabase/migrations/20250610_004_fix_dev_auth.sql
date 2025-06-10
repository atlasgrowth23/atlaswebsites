-- Fix RLS policies for development deployment
-- Allow public access to tenants and contacts for development

-- Drop existing policies
DROP POLICY IF EXISTS "dev_tenant_access" ON tenants;
DROP POLICY IF EXISTS "dev_contacts_access" ON contacts;
DROP POLICY IF EXISTS "tenant_isolation" ON tenants;
DROP POLICY IF EXISTS "tenant_contacts_isolation" ON contacts;

-- Create permissive policies for development
CREATE POLICY "allow_all_tenants" ON tenants FOR ALL USING (true);
CREATE POLICY "allow_all_contacts" ON contacts FOR ALL USING (true);