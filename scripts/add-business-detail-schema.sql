-- Add extended fields to leads table
ALTER TABLE leads ADD COLUMN IF NOT EXISTS owner_name TEXT;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS software_used TEXT;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS interest_level INTEGER CHECK (interest_level >= 1 AND interest_level <= 5);
ALTER TABLE leads ADD COLUMN IF NOT EXISTS estimated_value DECIMAL(10,2);
ALTER TABLE leads ADD COLUMN IF NOT EXISTS best_contact_time TEXT;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS qualification_checklist JSONB DEFAULT '{}';
ALTER TABLE leads ADD COLUMN IF NOT EXISTS next_followup_date TIMESTAMP WITH TIME ZONE;

-- Create lead_notes table
CREATE TABLE IF NOT EXISTS lead_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id UUID REFERENCES leads(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  is_private BOOLEAN DEFAULT false,
  created_by TEXT NOT NULL DEFAULT 'admin',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create lead_activity table
CREATE TABLE IF NOT EXISTS lead_activity (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id UUID REFERENCES leads(id) ON DELETE CASCADE,
  activity_type TEXT NOT NULL CHECK (activity_type IN ('call', 'email', 'sms', 'stage_move', 'note')),
  description TEXT NOT NULL,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_lead_notes_lead_id ON lead_notes(lead_id);
CREATE INDEX IF NOT EXISTS idx_lead_notes_created_at ON lead_notes(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_lead_activity_lead_id ON lead_activity(lead_id);
CREATE INDEX IF NOT EXISTS idx_lead_activity_created_at ON lead_activity(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_lead_activity_type ON lead_activity(activity_type);
CREATE INDEX IF NOT EXISTS idx_leads_next_followup ON leads(next_followup_date) WHERE next_followup_date IS NOT NULL;

-- Create trigger to automatically add activity when notes are added
CREATE OR REPLACE FUNCTION create_note_activity()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO lead_activity (lead_id, activity_type, description, metadata)
  VALUES (
    NEW.lead_id,
    'note',
    CASE 
      WHEN NEW.is_private THEN 'Added private note'
      ELSE 'Added note: ' || LEFT(NEW.content, 100) || CASE WHEN LENGTH(NEW.content) > 100 THEN '...' ELSE '' END
    END,
    jsonb_build_object(
      'note_id', NEW.id,
      'is_private', NEW.is_private,
      'created_by', NEW.created_by
    )
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_note_activity
  AFTER INSERT ON lead_notes
  FOR EACH ROW
  EXECUTE FUNCTION create_note_activity();

-- Create trigger to update updated_at timestamp on lead_notes
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_lead_notes_updated_at
  BEFORE UPDATE ON lead_notes
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();