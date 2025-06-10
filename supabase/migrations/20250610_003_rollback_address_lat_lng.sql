-- Rollback lat/lng columns from contacts

DROP INDEX IF EXISTS idx_contacts_location;

ALTER TABLE contacts 
DROP COLUMN IF EXISTS lat,
DROP COLUMN IF EXISTS lng;