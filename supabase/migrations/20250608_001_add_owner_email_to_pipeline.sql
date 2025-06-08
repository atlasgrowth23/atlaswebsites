-- Add owner_email column to lead_pipeline table
-- Migration: 20250608_001_add_owner_email_to_pipeline.sql

ALTER TABLE lead_pipeline 
ADD COLUMN IF NOT EXISTS owner_email VARCHAR(255);

-- Create index for performance on email searches
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_lead_pipeline_owner_email 
ON lead_pipeline(owner_email);

-- Backfill owner_email from tk_contacts where available
UPDATE lead_pipeline 
SET owner_email = tk_contacts.owner_email
FROM tk_contacts 
WHERE lead_pipeline.company_id = tk_contacts.company_id 
AND lead_pipeline.owner_email IS NULL 
AND tk_contacts.owner_email IS NOT NULL;