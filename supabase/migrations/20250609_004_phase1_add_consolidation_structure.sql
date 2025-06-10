-- Migration: Phase 1 - Add new consolidated structure (no breaking changes)
-- Date: 2025-06-09
-- Description: Add new structure for database consolidation without breaking existing functionality

-- PHASE 1: ADD NEW STRUCTURE WITHOUT BREAKING CHANGES
-- This migration adds the new consolidated structure alongside existing tables
-- All existing APIs continue to work unchanged

-- 1. Add JSON columns to lead_pipeline for consolidated data
ALTER TABLE lead_pipeline 
ADD COLUMN IF NOT EXISTS notes_json JSONB DEFAULT '[]'::jsonb;

ALTER TABLE lead_pipeline 
ADD COLUMN IF NOT EXISTS tags JSONB DEFAULT '[]'::jsonb;

-- 2. Create unified business_owners table (consolidates tk_contacts + client_users)
CREATE TABLE IF NOT EXISTS business_owners (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  name VARCHAR(255),
  email VARCHAR(255),
  phone VARCHAR(255),
  
  -- Auth fields (from client_users functionality)
  auth_provider VARCHAR(50) DEFAULT 'email',
  provider_id VARCHAR(255),
  avatar_url TEXT,
  last_login TIMESTAMP WITH TIME ZONE,
  is_active BOOLEAN DEFAULT true,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT business_owners_email_unique UNIQUE (email),
  CONSTRAINT business_owners_company_email_unique UNIQUE (company_id, email)
);

-- 3. Add reference to business_owners from lead_pipeline
ALTER TABLE lead_pipeline 
ADD COLUMN IF NOT EXISTS business_owner_id UUID REFERENCES business_owners(id);

-- 4. Add performance indexes
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_business_owners_company_id 
ON business_owners(company_id);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_business_owners_email 
ON business_owners(email);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_lead_pipeline_business_owner 
ON lead_pipeline(business_owner_id);

-- JSON GIN index for efficient tag queries
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_lead_pipeline_tags 
ON lead_pipeline USING GIN (tags);

-- IMPORTANT: This migration maintains full backward compatibility
-- All existing tables and columns remain unchanged
-- Next phases will migrate data and update APIs gradually