-- Rollback: Remove owner_email column from lead_pipeline table
-- Rollback: 20250608_001_rollback_owner_email_pipeline.sql

-- Drop index first
DROP INDEX IF EXISTS idx_lead_pipeline_owner_email;

-- Drop column
ALTER TABLE lead_pipeline 
DROP COLUMN IF EXISTS owner_email;