-- Companies table for HVAC businesses
CREATE TABLE IF NOT EXISTS companies (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  phone TEXT,
  email TEXT,
  website TEXT,
  address TEXT,
  city TEXT,
  state TEXT,
  postal_code TEXT,
  rating DECIMAL(2,1),
  review_count INTEGER DEFAULT 0,
  logo TEXT,
  custom_domain TEXT,
  hours TEXT,
  saturday_hours TEXT,
  sunday_hours TEXT,
  emergency_service BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Company-specific frame customizations (images)
CREATE TABLE IF NOT EXISTS company_frames (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
  slug TEXT NOT NULL, -- frame identifier (hero_img, about_img, etc.)
  url TEXT NOT NULL,   -- custom image URL for this company
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(company_id, slug)
);

-- Template default frames (fallback images)
CREATE TABLE IF NOT EXISTS frames (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  slug TEXT NOT NULL,        -- frame identifier (hero_img, about_img, etc.)
  template_key TEXT NOT NULL, -- template name (moderntrust, boldenergy, etc.)
  default_url TEXT NOT NULL,  -- default image URL for template
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(slug, template_key)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_companies_slug ON companies(slug);
CREATE INDEX IF NOT EXISTS idx_companies_city_state ON companies(city, state);
CREATE INDEX IF NOT EXISTS idx_company_frames_company_id ON company_frames(company_id);
CREATE INDEX IF NOT EXISTS idx_company_frames_slug ON company_frames(slug);
CREATE INDEX IF NOT EXISTS idx_frames_template_key ON frames(template_key);

-- Enable Row Level Security (optional, but good practice)
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE company_frames ENABLE ROW LEVEL SECURITY;
ALTER TABLE frames ENABLE ROW LEVEL SECURITY;

-- Public read access (adjust as needed)
CREATE POLICY IF NOT EXISTS "Public companies read" ON companies FOR SELECT USING (true);
CREATE POLICY IF NOT EXISTS "Public company_frames read" ON company_frames FOR SELECT USING (true);
CREATE POLICY IF NOT EXISTS "Public frames read" ON frames FOR SELECT USING (true);

-- Insert some default template frames
INSERT INTO frames (slug, template_key, default_url, description) VALUES
  ('hero_img', 'moderntrust', '/images/hvac-hero-bg.jpg', 'Default hero background for ModernTrust template'),
  ('hero_img_2', 'moderntrust', '/images/hvac-hero-bg.svg', 'Alternate hero background for ModernTrust template'),
  ('about_img', 'moderntrust', '/images/default-hero.jpg', 'Default about section image for ModernTrust template')
ON CONFLICT (slug, template_key) DO NOTHING;