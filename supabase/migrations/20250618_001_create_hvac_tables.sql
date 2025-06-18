-- Migration: Create HVAC CRM tables (clean slate design)
-- Date: 2025-06-18
-- Description: New HVAC contact management system with activity tracking

-- HVAC Contacts table (replaces old contacts for HVAC CRM)
CREATE TABLE IF NOT EXISTS hvac_contacts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL,
    phone TEXT,
    email TEXT,
    status TEXT DEFAULT 'new_lead' CHECK (status IN ('new_lead', 'existing_customer')),
    source TEXT DEFAULT 'chat_widget' CHECK (source IN ('chat_widget', 'manual')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Ensure at least one contact method is provided
    CONSTRAINT hvac_contacts_contact_method CHECK (phone IS NOT NULL OR email IS NOT NULL)
);

-- Activity tracking for HVAC contacts
CREATE TABLE IF NOT EXISTS hvac_contact_activities (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    contact_id UUID NOT NULL REFERENCES hvac_contacts(id) ON DELETE CASCADE,
    activity_type TEXT NOT NULL CHECK (activity_type IN (
        'contact_created',
        'chat_service_request', 
        'chat_message_sent'
    )),
    description TEXT,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- HVAC Conversations (clean version of conversations)
CREATE TABLE IF NOT EXISTS hvac_conversations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    contact_id UUID REFERENCES hvac_contacts(id) ON DELETE CASCADE,
    visitor_id UUID NOT NULL,
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'closed', 'archived')),
    service_type TEXT, -- 'Repair', 'Install', 'Tune Up', 'Emergency'
    started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_message_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- HVAC Messages (clean version of chat_messages)
CREATE TABLE IF NOT EXISTS hvac_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    conversation_id UUID NOT NULL REFERENCES hvac_conversations(id) ON DELETE CASCADE,
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    contact_id UUID REFERENCES hvac_contacts(id) ON DELETE CASCADE,
    visitor_id UUID NOT NULL,
    message TEXT NOT NULL,
    is_from_visitor BOOLEAN NOT NULL DEFAULT true,
    message_type TEXT DEFAULT 'text' CHECK (message_type IN ('text', 'system')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_hvac_contacts_company_id ON hvac_contacts(company_id);
CREATE INDEX IF NOT EXISTS idx_hvac_contacts_phone ON hvac_contacts(phone) WHERE phone IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_hvac_contacts_email ON hvac_contacts(email) WHERE email IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_hvac_contacts_status ON hvac_contacts(status);
CREATE INDEX IF NOT EXISTS idx_hvac_contacts_created_at ON hvac_contacts(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_hvac_contact_activities_contact_id ON hvac_contact_activities(contact_id);
CREATE INDEX IF NOT EXISTS idx_hvac_contact_activities_type ON hvac_contact_activities(activity_type);
CREATE INDEX IF NOT EXISTS idx_hvac_contact_activities_created_at ON hvac_contact_activities(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_hvac_conversations_company_id ON hvac_conversations(company_id);
CREATE INDEX IF NOT EXISTS idx_hvac_conversations_contact_id ON hvac_conversations(contact_id);
CREATE INDEX IF NOT EXISTS idx_hvac_conversations_visitor_id ON hvac_conversations(visitor_id);
CREATE INDEX IF NOT EXISTS idx_hvac_conversations_last_message ON hvac_conversations(last_message_at DESC);

CREATE INDEX IF NOT EXISTS idx_hvac_messages_conversation_id ON hvac_messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_hvac_messages_contact_id ON hvac_messages(contact_id);
CREATE INDEX IF NOT EXISTS idx_hvac_messages_created_at ON hvac_messages(created_at DESC);

-- Row Level Security
ALTER TABLE hvac_contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE hvac_contact_activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE hvac_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE hvac_messages ENABLE ROW LEVEL SECURITY;

-- RLS Policies for hvac_contacts
CREATE POLICY hvac_contacts_company_access ON hvac_contacts
    FOR ALL TO authenticated
    USING (company_id IN (
        SELECT c.id FROM companies c 
        WHERE c.email_1 = auth.jwt() ->> 'email'
    ));

-- RLS Policies for hvac_contact_activities
CREATE POLICY hvac_contact_activities_company_access ON hvac_contact_activities
    FOR ALL TO authenticated
    USING (contact_id IN (
        SELECT hc.id FROM hvac_contacts hc
        JOIN companies c ON hc.company_id = c.id
        WHERE c.email_1 = auth.jwt() ->> 'email'
    ));

-- RLS Policies for hvac_conversations
CREATE POLICY hvac_conversations_company_access ON hvac_conversations
    FOR ALL TO authenticated
    USING (company_id IN (
        SELECT c.id FROM companies c 
        WHERE c.email_1 = auth.jwt() ->> 'email'
    ));

-- RLS Policies for hvac_messages
CREATE POLICY hvac_messages_company_access ON hvac_messages
    FOR ALL TO authenticated
    USING (company_id IN (
        SELECT c.id FROM companies c 
        WHERE c.email_1 = auth.jwt() ->> 'email'
    ));

-- Function to update last_message_at on conversations
CREATE OR REPLACE FUNCTION update_hvac_conversation_last_message()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE hvac_conversations 
    SET last_message_at = NOW()
    WHERE id = NEW.conversation_id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-update conversation last_message_at
CREATE TRIGGER trigger_update_hvac_conversation_message
    AFTER INSERT ON hvac_messages
    FOR EACH ROW
    EXECUTE FUNCTION update_hvac_conversation_last_message();

-- Function to update updated_at timestamp on hvac_contacts
CREATE OR REPLACE FUNCTION update_hvac_contact_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-update updated_at
CREATE TRIGGER trigger_update_hvac_contact_timestamp
    BEFORE UPDATE ON hvac_contacts
    FOR EACH ROW
    EXECUTE FUNCTION update_hvac_contact_updated_at();