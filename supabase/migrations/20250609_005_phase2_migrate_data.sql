-- Migration: Phase 2 - Migrate data to consolidated structure (no breaking changes)
-- Date: 2025-06-09
-- Description: Migrate all data from scattered tables to new consolidated structure

-- PHASE 2: DATA MIGRATION - POPULATE NEW STRUCTURE
-- This migration copies all data from old scattered structure to new consolidated structure
-- All existing APIs continue to work unchanged during this process

-- 1. Migrate notes data: lead_notes → lead_pipeline.notes_json
-- Groups all notes by lead_id into JSON arrays with full note objects
UPDATE lead_pipeline 
SET notes_json = notes_data.notes_array
FROM (
  SELECT 
    lead_id,
    json_agg(
      json_build_object(
        'id', id,
        'content', content,
        'is_private', is_private,
        'created_by', created_by,
        'created_at', created_at,
        'updated_at', updated_at
      ) ORDER BY created_at DESC
    ) as notes_array
  FROM lead_notes 
  GROUP BY lead_id
) as notes_data
WHERE lead_pipeline.id = notes_data.lead_id;

-- 2. Migrate tags data: lead_tags → lead_pipeline.tags
-- Creates simple arrays of tag types for efficient querying
UPDATE lead_pipeline 
SET tags = tags_data.tag_types_array
FROM (
  SELECT 
    lead_id,
    json_agg(tag_type ORDER BY created_at DESC) as tag_types_array
  FROM lead_tags
  GROUP BY lead_id
) as tags_data
WHERE lead_pipeline.id = tags_data.lead_id;

-- 3. Migrate business owners: tk_contacts → business_owners
-- Consolidates contact information with conflict resolution
INSERT INTO business_owners (
  company_id, name, email, auth_provider, created_at, updated_at
)
SELECT 
  company_id,
  owner_name as name,
  owner_email as email,
  'pipeline_contact' as auth_provider,
  created_at,
  updated_at
FROM tk_contacts
ON CONFLICT (company_id, email) DO UPDATE SET
  name = EXCLUDED.name,
  updated_at = EXCLUDED.updated_at;

-- 4. Populate business_owner_id references in lead_pipeline
-- Links leads to business owners via email matching
UPDATE lead_pipeline 
SET business_owner_id = bo.id
FROM business_owners bo
WHERE lead_pipeline.owner_email = bo.email
AND lead_pipeline.business_owner_id IS NULL;

-- 5. Create missing business_owners from lead_pipeline owner data
-- Handles cases where lead_pipeline has owner info not in tk_contacts
INSERT INTO business_owners (company_id, name, email, auth_provider)
SELECT DISTINCT 
  lp.company_id,
  lp.owner_name,
  lp.owner_email,
  'pipeline_contact'
FROM lead_pipeline lp
LEFT JOIN business_owners bo ON lp.owner_email = bo.email
WHERE lp.owner_email IS NOT NULL 
AND lp.owner_email != ''
AND bo.id IS NULL
ON CONFLICT (company_id, email) DO NOTHING;

-- 6. Final pass to link any remaining leads
UPDATE lead_pipeline 
SET business_owner_id = bo.id
FROM business_owners bo
WHERE lead_pipeline.owner_email = bo.email
AND lead_pipeline.business_owner_id IS NULL;

-- IMPORTANT: This migration maintains full backward compatibility
-- All existing tables remain unchanged and functional
-- New consolidated data is available alongside old structure
-- Next phase will update APIs to use new structure