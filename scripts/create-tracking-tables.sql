-- Tracking tables for Supabase
-- Run this in your Supabase SQL editor

-- 1. Template views tracking table
CREATE TABLE IF NOT EXISTS template_views (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id TEXT NOT NULL REFERENCES companies(id),
  company_slug TEXT NOT NULL,
  template_key TEXT NOT NULL,
  session_id TEXT NOT NULL,
  user_agent TEXT,
  referrer_url TEXT,
  ip_address INET,
  country TEXT,
  city TEXT,
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
  device_type TEXT,
  browser_name TEXT,
  total_time_seconds INTEGER DEFAULT 0,
  page_interactions INTEGER DEFAULT 0,
  visit_start_time TIMESTAMPTZ DEFAULT NOW(),
  visit_end_time TIMESTAMPTZ,
  is_initial_visit BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Prospect tracking table (for lead generation)
CREATE TABLE IF NOT EXISTS prospect_tracking (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id TEXT NOT NULL REFERENCES companies(id),
  session_id TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  name TEXT,
  message TEXT,
  form_type TEXT, -- 'contact', 'quote', 'chat', etc.
  source_page TEXT,
  referrer_url TEXT,
  user_agent TEXT,
  ip_address INET,
  country TEXT,
  city TEXT,
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Daily analytics summary table (for performance)
CREATE TABLE IF NOT EXISTS daily_analytics (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id TEXT NOT NULL REFERENCES companies(id),
  date DATE NOT NULL,
  total_views INTEGER DEFAULT 0,
  unique_sessions INTEGER DEFAULT 0,
  total_time_seconds INTEGER DEFAULT 0,
  bounce_rate DECIMAL(5, 2), -- percentage
  mobile_percentage DECIMAL(5, 2),
  top_referrer TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(company_id, date)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_template_views_company_id ON template_views(company_id);
CREATE INDEX IF NOT EXISTS idx_template_views_session_id ON template_views(session_id);
CREATE INDEX IF NOT EXISTS idx_template_views_created_at ON template_views(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_prospect_tracking_company_id ON prospect_tracking(company_id);
CREATE INDEX IF NOT EXISTS idx_prospect_tracking_created_at ON prospect_tracking(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_daily_analytics_company_date ON daily_analytics(company_id, date);

-- Enable Row Level Security (RLS)
ALTER TABLE template_views ENABLE ROW LEVEL SECURITY;
ALTER TABLE prospect_tracking ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_analytics ENABLE ROW LEVEL SECURITY;

-- RLS Policies (allow all for now, can be restricted later)
CREATE POLICY "Allow all access to template_views" ON template_views FOR ALL USING (true);
CREATE POLICY "Allow all access to prospect_tracking" ON prospect_tracking FOR ALL USING (true);
CREATE POLICY "Allow all access to daily_analytics" ON daily_analytics FOR ALL USING (true);

-- Create or replace function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_template_views_updated_at 
    BEFORE UPDATE ON template_views 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_daily_analytics_updated_at 
    BEFORE UPDATE ON daily_analytics 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();