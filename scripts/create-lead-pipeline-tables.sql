-- Lead Pipeline Tables Setup Script
-- Creates leads, lead_notes, and lead_activities tables with proper constraints and policies

-- Create leads table
CREATE TABLE IF NOT EXISTS public.leads (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    phone TEXT,
    email TEXT,
    business_name TEXT,
    status TEXT NOT NULL DEFAULT 'new_lead' 
        CHECK (status IN ('new_lead', 'called', 'site_sent', 'site_viewed', 'appointment', 'follow_up', 'closed_won', 'closed_lost')),
    sub_status TEXT 
        CHECK (sub_status IN ('answered', 'no_answer', 'voicemail_left', 'interested', 'not_interested', 'callback_requested', 'appointment_scheduled', 'no_show', 'completed')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    assigned_to TEXT, -- user email
    last_contacted_at TIMESTAMP WITH TIME ZONE
);

-- Create lead_notes table
CREATE TABLE IF NOT EXISTS public.lead_notes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    lead_id UUID REFERENCES public.leads(id) ON DELETE CASCADE NOT NULL,
    user_email TEXT NOT NULL,
    note_text TEXT NOT NULL,
    note_type TEXT NOT NULL DEFAULT 'note' 
        CHECK (note_type IN ('note', 'call', 'email', 'meeting')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Create lead_activities table for audit trail
CREATE TABLE IF NOT EXISTS public.lead_activities (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    lead_id UUID REFERENCES public.leads(id) ON DELETE CASCADE NOT NULL,
    activity_type TEXT NOT NULL 
        CHECK (activity_type IN ('status_change', 'site_visit', 'note_added', 'call_logged', 'email_sent', 'appointment_scheduled')),
    old_value TEXT,
    new_value TEXT,
    triggered_by TEXT NOT NULL DEFAULT 'user' 
        CHECK (triggered_by IN ('user', 'system')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_leads_company_id ON public.leads(company_id);
CREATE INDEX IF NOT EXISTS idx_leads_status ON public.leads(status);
CREATE INDEX IF NOT EXISTS idx_leads_assigned_to ON public.leads(assigned_to);
CREATE INDEX IF NOT EXISTS idx_leads_created_at ON public.leads(created_at);
CREATE INDEX IF NOT EXISTS idx_leads_last_contacted_at ON public.leads(last_contacted_at);

CREATE INDEX IF NOT EXISTS idx_lead_notes_lead_id ON public.lead_notes(lead_id);
CREATE INDEX IF NOT EXISTS idx_lead_notes_created_at ON public.lead_notes(created_at);
CREATE INDEX IF NOT EXISTS idx_lead_notes_user_email ON public.lead_notes(user_email);

CREATE INDEX IF NOT EXISTS idx_lead_activities_lead_id ON public.lead_activities(lead_id);
CREATE INDEX IF NOT EXISTS idx_lead_activities_activity_type ON public.lead_activities(activity_type);
CREATE INDEX IF NOT EXISTS idx_lead_activities_created_at ON public.lead_activities(created_at);

-- Create function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger to automatically update updated_at on leads table
DROP TRIGGER IF EXISTS update_leads_updated_at ON public.leads;
CREATE TRIGGER update_leads_updated_at
    BEFORE UPDATE ON public.leads
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security (RLS)
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lead_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lead_activities ENABLE ROW LEVEL SECURITY;

-- Create RLS policies

-- Leads policies
CREATE POLICY "Enable read access for all users" ON public.leads
    FOR SELECT USING (true);

CREATE POLICY "Enable insert for authenticated users" ON public.leads
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Enable update for authenticated users" ON public.leads
    FOR UPDATE USING (true);

CREATE POLICY "Enable delete for authenticated users" ON public.leads
    FOR DELETE USING (true);

-- Lead notes policies
CREATE POLICY "Enable read access for all users" ON public.lead_notes
    FOR SELECT USING (true);

CREATE POLICY "Enable insert for authenticated users" ON public.lead_notes
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Enable update for authenticated users" ON public.lead_notes
    FOR UPDATE USING (true);

CREATE POLICY "Enable delete for authenticated users" ON public.lead_notes
    FOR DELETE USING (true);

-- Lead activities policies
CREATE POLICY "Enable read access for all users" ON public.lead_activities
    FOR SELECT USING (true);

CREATE POLICY "Enable insert for authenticated users" ON public.lead_activities
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Enable update for authenticated users" ON public.lead_activities
    FOR UPDATE USING (true);

CREATE POLICY "Enable delete for authenticated users" ON public.lead_activities
    FOR DELETE USING (true);

-- Grant necessary permissions
GRANT ALL ON public.leads TO authenticated;
GRANT ALL ON public.lead_notes TO authenticated;
GRANT ALL ON public.lead_activities TO authenticated;

GRANT ALL ON public.leads TO anon;
GRANT ALL ON public.lead_notes TO anon;
GRANT ALL ON public.lead_activities TO anon;

-- Create function to log status changes automatically
CREATE OR REPLACE FUNCTION log_lead_status_change()
RETURNS TRIGGER AS $$
BEGIN
    -- Only log if status actually changed
    IF OLD.status IS DISTINCT FROM NEW.status THEN
        INSERT INTO public.lead_activities (lead_id, activity_type, old_value, new_value, triggered_by)
        VALUES (NEW.id, 'status_change', OLD.status, NEW.status, 'user');
    END IF;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger to automatically log status changes
DROP TRIGGER IF EXISTS log_lead_status_change_trigger ON public.leads;
CREATE TRIGGER log_lead_status_change_trigger
    AFTER UPDATE ON public.leads
    FOR EACH ROW
    EXECUTE FUNCTION log_lead_status_change();

-- Create function to log note additions
CREATE OR REPLACE FUNCTION log_note_addition()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.lead_activities (lead_id, activity_type, new_value, triggered_by)
    VALUES (NEW.lead_id, 'note_added', NEW.note_type || ': ' || LEFT(NEW.note_text, 100), 'user');
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger to automatically log note additions
DROP TRIGGER IF EXISTS log_note_addition_trigger ON public.lead_notes;
CREATE TRIGGER log_note_addition_trigger
    AFTER INSERT ON public.lead_notes
    FOR EACH ROW
    EXECUTE FUNCTION log_note_addition();

-- Insert some sample data to test the tables
INSERT INTO public.leads (company_id, name, phone, email, business_name, status, assigned_to) 
SELECT 
    c.id,
    'John Smith',
    '555-0123',
    'john@example.com',
    'Smith HVAC Services',
    'new_lead',
    'admin@test.com'
FROM public.companies c 
LIMIT 1
ON CONFLICT DO NOTHING;

-- Display table creation summary
SELECT 
    schemaname,
    tablename,
    tableowner
FROM pg_tables 
WHERE tablename IN ('leads', 'lead_notes', 'lead_activities')
ORDER BY tablename;