-- Add voice_logs table for tracking Atlas voice commands
CREATE TABLE IF NOT EXISTS voice_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID,
  tenant_id UUID,
  transcript TEXT,
  intent TEXT,
  confidence NUMERIC,
  success BOOLEAN,
  error_message TEXT,
  response_time_ms INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_voice_logs_tenant_id ON voice_logs(tenant_id);
CREATE INDEX IF NOT EXISTS idx_voice_logs_created_at ON voice_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_voice_logs_intent ON voice_logs(intent);
CREATE INDEX IF NOT EXISTS idx_voice_logs_success ON voice_logs(success);

-- Enable RLS
ALTER TABLE voice_logs ENABLE ROW LEVEL SECURITY;

-- Create permissive policy for development
CREATE POLICY "allow_all_voice_logs" ON voice_logs FOR ALL USING (true);