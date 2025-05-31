-- Update companies table to match the combined CSV structure
ALTER TABLE companies 
ADD COLUMN IF NOT EXISTS reviews INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS place_id TEXT,
ADD COLUMN IF NOT EXISTS reviews_link TEXT,
ADD COLUMN IF NOT EXISTS predicted_label TEXT,
ADD COLUMN IF NOT EXISTS r_30 INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS r_60 INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS r_90 INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS r_365 INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS first_review_date TEXT,
ADD COLUMN IF NOT EXISTS parsed_working_hours JSONB,
ADD COLUMN IF NOT EXISTS site TEXT,
ADD COLUMN IF NOT EXISTS latitude DECIMAL(10,8),
ADD COLUMN IF NOT EXISTS longitude DECIMAL(11,8),
ADD COLUMN IF NOT EXISTS first_name TEXT,
ADD COLUMN IF NOT EXISTS last_name TEXT,
ADD COLUMN IF NOT EXISTS modern_trust_preview TEXT;

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_companies_place_id ON companies(place_id);
CREATE INDEX IF NOT EXISTS idx_companies_rating ON companies(rating);
CREATE INDEX IF NOT EXISTS idx_companies_reviews ON companies(reviews);
CREATE INDEX IF NOT EXISTS idx_companies_r_365 ON companies(r_365);
CREATE INDEX IF NOT EXISTS idx_companies_location ON companies(latitude, longitude);
CREATE INDEX IF NOT EXISTS idx_companies_state_city ON companies(state, city);

-- Update review_count to match reviews column (run this after uploading CSV data)
-- UPDATE companies SET review_count = reviews WHERE reviews IS NOT NULL;