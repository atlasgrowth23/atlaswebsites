-- Professional database indexes for analytics performance
-- Run this on your Supabase database

-- Template Views table indexes
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_template_views_company_id 
ON template_views(company_id);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_template_views_session_id 
ON template_views(session_id);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_template_views_created_at 
ON template_views(created_at DESC);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_template_views_company_date 
ON template_views(company_id, created_at DESC);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_template_views_visit_start 
ON template_views(visit_start_time DESC);

-- Composite index for analytics queries
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_template_views_analytics 
ON template_views(company_id, session_id, total_time_seconds, visit_start_time DESC);

-- Companies table indexes
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_companies_state 
ON companies(state);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_companies_slug 
ON companies(slug);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_companies_state_city 
ON companies(state, city);

-- Company frames indexes
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_company_frames_company_id 
ON company_frames(company_id);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_company_frames_slug 
ON company_frames(slug);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_company_frames_lookup 
ON company_frames(company_id, slug);

-- Template frames indexes
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_frames_template_key 
ON frames(template_key);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_frames_slug 
ON frames(slug);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_frames_lookup 
ON frames(template_key, slug);

-- Pipeline indexes (if lead_pipeline table exists)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_lead_pipeline_company_id 
ON lead_pipeline(company_id);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_lead_pipeline_stage 
ON lead_pipeline(stage);

-- Daily analytics indexes (if daily_analytics table exists)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_daily_analytics_company_date 
ON daily_analytics(company_id, date DESC);

-- Query optimization indexes for common patterns
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_template_views_time_range 
ON template_views(created_at, company_id) 
WHERE total_time_seconds > 0;

-- Partial index for active sessions
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_template_views_active_sessions 
ON template_views(session_id, company_id, visit_start_time) 
WHERE visit_end_time IS NULL;

-- Print success message
DO $$ 
BEGIN 
    RAISE NOTICE 'Analytics indexes created successfully!';
    RAISE NOTICE 'Query performance should be significantly improved.';
END $$;