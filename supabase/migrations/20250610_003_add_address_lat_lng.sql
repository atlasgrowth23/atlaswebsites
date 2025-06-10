-- Add lat/lng columns to contacts for Google Maps integration

ALTER TABLE contacts 
ADD COLUMN IF NOT EXISTS lat DOUBLE PRECISION,
ADD COLUMN IF NOT EXISTS lng DOUBLE PRECISION;

-- Create spatial index for potential location-based queries
CREATE INDEX IF NOT EXISTS idx_contacts_location ON contacts(lat, lng);