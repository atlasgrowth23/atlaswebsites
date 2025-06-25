-- Pipeline v2 Database Schema
-- Clean, scalable pipeline system for multi-business outreach

-- Business Types (extensible beyond HVAC)
CREATE TABLE IF NOT EXISTS business_types (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL, -- 'HVAC', 'Plumbing', 'Electrical', etc.
  slug VARCHAR(100) NOT NULL UNIQUE,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Geographic Regions
CREATE TABLE IF NOT EXISTS regions (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL, -- 'Alabama', 'Arkansas', etc.
  slug VARCHAR(100) NOT NULL UNIQUE,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Campaigns (organizational container)
CREATE TABLE IF NOT EXISTS campaigns (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  business_type_id INTEGER REFERENCES business_types(id),
  region_id INTEGER REFERENCES regions(id),
  description TEXT,
  status VARCHAR(50) DEFAULT 'active', -- active, paused, completed
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Pipeline Stages (configurable per campaign)
CREATE TABLE IF NOT EXISTS pipeline_stages (
  id SERIAL PRIMARY KEY,
  campaign_id INTEGER REFERENCES campaigns(id),
  name VARCHAR(100) NOT NULL, -- 'New Lead', 'SMS Sent', 'Link Clicked', etc.
  slug VARCHAR(100) NOT NULL,
  order_index INTEGER NOT NULL,
  color VARCHAR(7) DEFAULT '#6b7280', -- hex color for UI
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  
  UNIQUE(campaign_id, slug),
  UNIQUE(campaign_id, order_index)
);

-- Leads (the actual prospects)
CREATE TABLE IF NOT EXISTS leads (
  id SERIAL PRIMARY KEY,
  campaign_id INTEGER REFERENCES campaigns(id),
  current_stage_id INTEGER REFERENCES pipeline_stages(id),
  
  -- Business Information
  business_name VARCHAR(255) NOT NULL,
  phone VARCHAR(20),
  email VARCHAR(255),
  website VARCHAR(255),
  address TEXT,
  city VARCHAR(100),
  state VARCHAR(50),
  zip_code VARCHAR(10),
  
  -- Contact Person
  contact_name VARCHAR(255),
  contact_title VARCHAR(100),
  
  -- Engagement Data
  video_id VARCHAR(100), -- Repliq video ID
  video_link TEXT, -- Full Repliq video URL
  landing_page_url TEXT, -- Generated landing page URL
  
  -- Tracking
  sms_sent_count INTEGER DEFAULT 0,
  link_clicks INTEGER DEFAULT 0,
  video_watch_duration INTEGER DEFAULT 0, -- seconds
  video_completed BOOLEAN DEFAULT false,
  
  -- Status
  status VARCHAR(50) DEFAULT 'active', -- active, converted, dead, paused
  priority VARCHAR(20) DEFAULT 'normal', -- high, normal, low
  
  -- Metadata
  source VARCHAR(100), -- 'manual', 'import', 'api'
  notes TEXT,
  tags JSONB DEFAULT '[]',
  metadata JSONB DEFAULT '{}',
  
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- SMS Messages (track all SMS communications)
CREATE TABLE IF NOT EXISTS sms_messages (
  id SERIAL PRIMARY KEY,
  lead_id INTEGER REFERENCES leads(id),
  
  -- Message Content
  message_text TEXT NOT NULL,
  phone_number VARCHAR(20) NOT NULL,
  
  -- Sending Details
  sent_by VARCHAR(255), -- admin email who sent it
  sent_at TIMESTAMP DEFAULT NOW(),
  
  -- TextGrid Details
  textgrid_message_id VARCHAR(255),
  textgrid_status VARCHAR(50), -- queued, sent, delivered, failed
  textgrid_response JSONB,
  
  -- Tracking
  delivery_status VARCHAR(50) DEFAULT 'pending', -- pending, delivered, failed
  error_message TEXT,
  
  created_at TIMESTAMP DEFAULT NOW()
);

-- Activities (comprehensive activity tracking)
CREATE TABLE IF NOT EXISTS lead_activities (
  id SERIAL PRIMARY KEY,
  lead_id INTEGER REFERENCES leads(id),
  
  -- Activity Details
  activity_type VARCHAR(100) NOT NULL, -- 'sms_sent', 'link_clicked', 'video_watched', 'stage_changed', 'note_added', 'button_clicked'
  description TEXT,
  
  -- Stage Movement
  from_stage_id INTEGER REFERENCES pipeline_stages(id),
  to_stage_id INTEGER REFERENCES pipeline_stages(id),
  
  -- Data Payload
  data JSONB DEFAULT '{}', -- flexible data storage
  
  -- User/System Info
  performed_by VARCHAR(255), -- admin email or 'system'
  ip_address INET,
  user_agent TEXT,
  
  created_at TIMESTAMP DEFAULT NOW()
);

-- Button Actions (track landing page interactions)
CREATE TABLE IF NOT EXISTS button_actions (
  id SERIAL PRIMARY KEY,
  lead_id INTEGER REFERENCES leads(id),
  
  -- Action Details
  button_type VARCHAR(100) NOT NULL, -- 'view_website', 'schedule_call', 'ask_questions', 'not_interested'
  button_text VARCHAR(255), -- actual button text clicked
  
  -- Context
  page_url TEXT,
  session_id VARCHAR(255),
  
  -- Tracking
  ip_address INET,
  user_agent TEXT,
  referrer TEXT,
  
  created_at TIMESTAMP DEFAULT NOW()
);

-- Admin Users (for Pipeline v2)
CREATE TABLE IF NOT EXISTS admin_users_v2 (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  name VARCHAR(255),
  role VARCHAR(50) DEFAULT 'admin', -- super_admin, admin, viewer
  
  -- Google OAuth
  google_id VARCHAR(255),
  avatar_url TEXT,
  
  -- Settings
  preferences JSONB DEFAULT '{}',
  is_active BOOLEAN DEFAULT true,
  
  created_at TIMESTAMP DEFAULT NOW(),
  last_login TIMESTAMP
);

-- Seed Data
INSERT INTO business_types (name, slug) VALUES 
  ('HVAC', 'hvac'),
  ('Plumbing', 'plumbing'),
  ('Electrical', 'electrical'),
  ('Roofing', 'roofing')
ON CONFLICT (slug) DO NOTHING;

INSERT INTO regions (name, slug) VALUES 
  ('Alabama', 'alabama'),
  ('Arkansas', 'arkansas'),
  ('Texas', 'texas'),
  ('Georgia', 'georgia')
ON CONFLICT (slug) DO NOTHING;

-- Create Alabama HVAC Campaign
INSERT INTO campaigns (name, business_type_id, region_id, description)
SELECT 
  'Alabama HVAC Outreach',
  bt.id,
  r.id,
  'Pipeline v2 test campaign for Alabama HVAC contractors'
FROM business_types bt, regions r
WHERE bt.slug = 'hvac' AND r.slug = 'alabama'
ON CONFLICT DO NOTHING;

-- Create Arkansas HVAC Campaign  
INSERT INTO campaigns (name, business_type_id, region_id, description)
SELECT 
  'Arkansas HVAC Outreach',
  bt.id,
  r.id,
  'Pipeline v2 test campaign for Arkansas HVAC contractors'
FROM business_types bt, regions r
WHERE bt.slug = 'hvac' AND r.slug = 'arkansas'
ON CONFLICT DO NOTHING;

-- Create default pipeline stages for campaigns
DO $$
DECLARE
    campaign_rec RECORD;
BEGIN
    FOR campaign_rec IN SELECT id FROM campaigns WHERE name LIKE '%HVAC Outreach'
    LOOP
        INSERT INTO pipeline_stages (campaign_id, name, slug, order_index, color) VALUES
          (campaign_rec.id, 'New Lead', 'new_lead', 1, '#6b7280'),
          (campaign_rec.id, 'SMS Sent', 'sms_sent', 2, '#3b82f6'),
          (campaign_rec.id, 'Link Clicked', 'link_clicked', 3, '#8b5cf6'),
          (campaign_rec.id, 'Video Watched', 'video_watched', 4, '#06b6d4'),
          (campaign_rec.id, 'Action Taken', 'action_taken', 5, '#10b981'),
          (campaign_rec.id, 'Qualified', 'qualified', 6, '#f59e0b'),
          (campaign_rec.id, 'Converted', 'converted', 7, '#22c55e'),
          (campaign_rec.id, 'Dead', 'dead', 8, '#ef4444')
        ON CONFLICT (campaign_id, slug) DO NOTHING;
    END LOOP;
END $$;

-- Create admin users
INSERT INTO admin_users_v2 (email, name, role) VALUES
  ('nicholas@atlasgrowth.ai', 'Nicholas', 'super_admin'),
  ('jared@atlasgrowth.ai', 'Jared', 'admin')
ON CONFLICT (email) DO NOTHING;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_leads_campaign_stage ON leads(campaign_id, current_stage_id);
CREATE INDEX IF NOT EXISTS idx_leads_status ON leads(status);
CREATE INDEX IF NOT EXISTS idx_lead_activities_lead_id ON lead_activities(lead_id);
CREATE INDEX IF NOT EXISTS idx_lead_activities_type ON lead_activities(activity_type);
CREATE INDEX IF NOT EXISTS idx_sms_messages_lead_id ON sms_messages(lead_id);
CREATE INDEX IF NOT EXISTS idx_button_actions_lead_id ON button_actions(lead_id);
CREATE INDEX IF NOT EXISTS idx_pipeline_stages_campaign ON pipeline_stages(campaign_id, order_index);

-- Add RLS policies (Row Level Security)
ALTER TABLE campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE lead_activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE sms_messages ENABLE ROW LEVEL SECURITY;

-- Policies for authenticated admin users
CREATE POLICY "Admin users can access all campaigns" ON campaigns FOR ALL USING (true);
CREATE POLICY "Admin users can access all leads" ON leads FOR ALL USING (true);
CREATE POLICY "Admin users can access all activities" ON lead_activities FOR ALL USING (true);
CREATE POLICY "Admin users can access all SMS messages" ON sms_messages FOR ALL USING (true);