-- Rollback: Recreate empty tables that were removed
-- Date: 2025-06-09
-- Description: Rollback script for cleanup_empty_tables migration

-- Recreate leads table structure (based on analysis of codebase)
CREATE TABLE IF NOT EXISTS leads (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    stage VARCHAR(50) DEFAULT 'new_lead',
    notes TEXT DEFAULT '',
    owner_name VARCHAR(255),
    software_used VARCHAR(255),
    interest_level INTEGER DEFAULT 0,
    estimated_value DECIMAL(10,2),
    qualification_checklist JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Recreate lead_activity table structure 
CREATE TABLE IF NOT EXISTS lead_activity (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    lead_id UUID NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
    activity_type VARCHAR(50) NOT NULL,
    description TEXT NOT NULL,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Recreate indexes
CREATE INDEX IF NOT EXISTS idx_leads_company_id ON leads(company_id);
CREATE INDEX IF NOT EXISTS idx_leads_stage ON leads(stage);
CREATE INDEX IF NOT EXISTS idx_lead_activity_lead_id ON lead_activity(lead_id);
CREATE INDEX IF NOT EXISTS idx_lead_activity_type ON lead_activity(activity_type);

-- Note: These tables will be empty after rollback - 
-- original data was confirmed empty before deletion