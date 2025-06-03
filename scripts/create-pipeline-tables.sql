-- Lead Pipeline Tables
-- Professional lead management system for HVAC contractors

-- Main pipeline tracking table
CREATE TABLE IF NOT EXISTS lead_pipeline (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  stage TEXT NOT NULL DEFAULT 'new_lead',
  last_contact_date TIMESTAMP WITH TIME ZONE,
  next_follow_up_date TIMESTAMP WITH TIME ZONE,
  notes TEXT DEFAULT '',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Ensure one pipeline entry per company
  UNIQUE(company_id),
  
  -- Valid stages constraint
  CONSTRAINT valid_stage CHECK (stage IN (
    'new_lead',
    'contacted', 
    'website_viewed',
    'appointment_scheduled',
    'follow_up',
    'sale_closed',
    'not_interested'
  ))
);

-- Contact history log
CREATE TABLE IF NOT EXISTS contact_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  stage_from TEXT,
  stage_to TEXT NOT NULL,
  notes TEXT DEFAULT '',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by TEXT -- admin user who made the change
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_lead_pipeline_stage ON lead_pipeline(stage);
CREATE INDEX IF NOT EXISTS idx_lead_pipeline_company ON lead_pipeline(company_id);
CREATE INDEX IF NOT EXISTS idx_lead_pipeline_updated ON lead_pipeline(updated_at);
CREATE INDEX IF NOT EXISTS idx_contact_log_company ON contact_log(company_id);
CREATE INDEX IF NOT EXISTS idx_contact_log_created ON contact_log(created_at);

-- Auto-update timestamp function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger to auto-update the updated_at timestamp
DROP TRIGGER IF EXISTS update_lead_pipeline_updated_at ON lead_pipeline;
CREATE TRIGGER update_lead_pipeline_updated_at
    BEFORE UPDATE ON lead_pipeline
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Add some indexes on existing companies table if they don't exist
CREATE INDEX IF NOT EXISTS idx_companies_state ON companies(state);
CREATE INDEX IF NOT EXISTS idx_companies_tracking ON companies(tracking_enabled);

-- Sample view for reporting
CREATE OR REPLACE VIEW pipeline_summary AS
SELECT 
  stage,
  COUNT(*) as count,
  COUNT(*) FILTER (WHERE created_at > NOW() - INTERVAL '7 days') as added_this_week,
  COUNT(*) FILTER (WHERE updated_at > NOW() - INTERVAL '24 hours') as updated_today
FROM lead_pipeline 
GROUP BY stage
ORDER BY 
  CASE stage
    WHEN 'new_lead' THEN 1
    WHEN 'contacted' THEN 2
    WHEN 'website_viewed' THEN 3
    WHEN 'appointment_scheduled' THEN 4
    WHEN 'follow_up' THEN 5
    WHEN 'sale_closed' THEN 6
    WHEN 'not_interested' THEN 7
    ELSE 8
  END;