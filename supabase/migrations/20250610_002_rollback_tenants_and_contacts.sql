-- Rollback tenants and contacts migration

-- Drop triggers
DROP TRIGGER IF EXISTS update_contacts_updated_at ON contacts;
DROP FUNCTION IF EXISTS update_updated_at_column();

-- Drop indexes
DROP INDEX IF EXISTS idx_contacts_tenant_id;
DROP INDEX IF EXISTS idx_contacts_phone;
DROP INDEX IF EXISTS idx_contacts_email;
DROP INDEX IF EXISTS idx_contacts_equip_type;
DROP INDEX IF EXISTS idx_contacts_warranty_expiry;
DROP INDEX IF EXISTS idx_contacts_created_at;

-- Drop tables (contacts first due to FK constraint)
DROP TABLE IF EXISTS contacts CASCADE;
DROP TABLE IF EXISTS tenants CASCADE;