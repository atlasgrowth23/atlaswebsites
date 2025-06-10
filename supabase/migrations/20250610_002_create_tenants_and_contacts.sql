-- Create tenants and contacts tables for Atlas Phase 1
-- Tenants represent SaaS customers, contacts are their HVAC customers

-- Enable UUID extension if not exists
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Drop tables if they exist (for clean migration)
DROP TABLE IF EXISTS contacts CASCADE;
DROP TABLE IF EXISTS tenants CASCADE;

-- Create tenants table (minimal for now)
CREATE TABLE tenants (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID, -- FK to admin.companies when we wire it later
  business_name TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create contacts table
CREATE TABLE contacts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
  first_name TEXT,
  last_name TEXT,
  phone TEXT,
  email TEXT,
  address JSONB,
  equip_type TEXT, -- 'central_ac' | 'heat_pump' | 'furnace' | 'mini_split'
  model_number TEXT,
  serial_number TEXT,
  install_date DATE,
  filter_size TEXT,
  warranty_expiry DATE,
  unit_photo_url TEXT,
  notes TEXT,
  vertical_fields JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX idx_contacts_tenant_id ON contacts(tenant_id);
CREATE INDEX idx_contacts_phone ON contacts(phone);
CREATE INDEX idx_contacts_email ON contacts(email);
CREATE INDEX idx_contacts_equip_type ON contacts(equip_type);
CREATE INDEX idx_contacts_warranty_expiry ON contacts(warranty_expiry);
CREATE INDEX idx_contacts_created_at ON contacts(created_at DESC);

-- Enable RLS (for future authentication)
ALTER TABLE tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE contacts ENABLE ROW LEVEL SECURITY;

-- For development, allow all access (we'll tighten this with real auth)
CREATE POLICY "dev_tenant_access" ON tenants FOR ALL USING (true);
CREATE POLICY "dev_contacts_access" ON contacts FOR ALL USING (true);

-- Create a trigger to update updated_at on contacts
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_contacts_updated_at 
  BEFORE UPDATE ON contacts 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();