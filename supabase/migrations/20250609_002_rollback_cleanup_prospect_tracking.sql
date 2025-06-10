-- Rollback: Recreate prospect_tracking table
-- Date: 2025-06-09  
-- Description: Rollback script for prospect_tracking cleanup

-- Recreate prospect_tracking table structure (based on API in prospect-tracking.ts)
CREATE TABLE IF NOT EXISTS prospect_tracking (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    session_id VARCHAR(255) NOT NULL,
    email VARCHAR(255),
    phone VARCHAR(255),
    name VARCHAR(255),
    message TEXT,
    form_type VARCHAR(50) NOT NULL CHECK (form_type IN ('contact', 'quote', 'chat', 'call', 'email')),
    source_page VARCHAR(500) NOT NULL,
    referrer_url VARCHAR(500),
    user_agent TEXT,
    ip_address INET,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Recreate indexes
CREATE INDEX IF NOT EXISTS idx_prospect_tracking_company_id ON prospect_tracking(company_id);
CREATE INDEX IF NOT EXISTS idx_prospect_tracking_session_id ON prospect_tracking(session_id);
CREATE INDEX IF NOT EXISTS idx_prospect_tracking_form_type ON prospect_tracking(form_type);
CREATE INDEX IF NOT EXISTS idx_prospect_tracking_created_at ON prospect_tracking(created_at DESC);

-- Add constraint for contact info
ALTER TABLE prospect_tracking 
ADD CONSTRAINT prospect_tracking_contact_check 
CHECK (email IS NOT NULL OR phone IS NOT NULL OR name IS NOT NULL);

-- Note: Table will be empty after rollback - original data was confirmed empty before deletion