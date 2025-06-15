-- Task Assignment System for Nicholas and Jared
-- Manages team coordination and follow-ups

CREATE TABLE IF NOT EXISTS admin_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  priority TEXT CHECK (priority IN ('low', 'medium', 'high', 'urgent')) DEFAULT 'medium',
  status TEXT CHECK (status IN ('pending', 'in_progress', 'completed', 'cancelled')) DEFAULT 'pending',
  
  -- Assignment
  assigned_to TEXT CHECK (assigned_to IN ('Nicholas', 'Jared', 'Both')) DEFAULT 'Nicholas',
  created_by TEXT CHECK (created_by IN ('Nicholas', 'Jared')) DEFAULT 'Nicholas',
  
  -- Scheduling
  due_date TIMESTAMPTZ,
  reminder_date TIMESTAMPTZ,
  
  -- Pipeline integration
  related_company_id UUID REFERENCES companies(id),
  related_lead_id UUID, -- References pipeline_leads
  task_type TEXT CHECK (task_type IN ('follow_up', 'call', 'email', 'meeting', 'research', 'admin', 'other')) DEFAULT 'other',
  
  -- Tracking
  completed_at TIMESTAMPTZ,
  completed_by TEXT,
  notes TEXT,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_admin_tasks_assigned_to ON admin_tasks(assigned_to);
CREATE INDEX IF NOT EXISTS idx_admin_tasks_status ON admin_tasks(status);
CREATE INDEX IF NOT EXISTS idx_admin_tasks_due_date ON admin_tasks(due_date);
CREATE INDEX IF NOT EXISTS idx_admin_tasks_company ON admin_tasks(related_company_id);
CREATE INDEX IF NOT EXISTS idx_admin_tasks_created_at ON admin_tasks(created_at);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_admin_tasks_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically update updated_at
DROP TRIGGER IF EXISTS trigger_admin_tasks_updated_at ON admin_tasks;
CREATE TRIGGER trigger_admin_tasks_updated_at
  BEFORE UPDATE ON admin_tasks
  FOR EACH ROW
  EXECUTE FUNCTION update_admin_tasks_updated_at();

-- Sample data for testing
INSERT INTO admin_tasks (title, description, assigned_to, priority, task_type, due_date) VALUES
('Follow up with Johnson HVAC', 'Call back about website proposal', 'Nicholas', 'high', 'follow_up', NOW() + INTERVAL '1 day'),
('Research Alabama contractors', 'Find 50 new HVAC contractors in Alabama', 'Jared', 'medium', 'research', NOW() + INTERVAL '3 days'),
('Update pipeline templates', 'Create new email templates for follow-ups', 'Both', 'low', 'admin', NOW() + INTERVAL '1 week');

-- View for dashboard statistics
CREATE OR REPLACE VIEW admin_task_stats AS
SELECT 
  assigned_to,
  status,
  priority,
  COUNT(*) as task_count
FROM admin_tasks 
WHERE status != 'completed'
GROUP BY assigned_to, status, priority;