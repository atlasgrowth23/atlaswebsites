-- Migration: Create chat system tables for Atlas Websites
-- Date: 2025-06-07
-- Description: Creates contacts, conversations, and chat_messages tables for the custom chat widget

-- Table for storing contact information from chat widget
CREATE TABLE IF NOT EXISTS contacts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    visitor_id UUID NOT NULL,
    name TEXT NOT NULL,
    email TEXT,
    phone TEXT,
    last_interaction TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    scheduling_software TEXT DEFAULT NULL,
    CONSTRAINT contacts_email_or_phone CHECK (email IS NOT NULL OR phone IS NOT NULL)
);

-- Table for conversation sessions
CREATE TABLE IF NOT EXISTS conversations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    visitor_id UUID NOT NULL,
    contact_id UUID REFERENCES contacts(id) ON DELETE CASCADE,
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'closed', 'archived')),
    started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_message_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table for individual chat messages
CREATE TABLE IF NOT EXISTS chat_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    visitor_id UUID NOT NULL,
    message TEXT NOT NULL,
    is_from_visitor BOOLEAN NOT NULL DEFAULT true,
    message_type TEXT DEFAULT 'text' CHECK (message_type IN ('text', 'system', 'contact_prompt')),
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance (without CONCURRENTLY for migration)
CREATE INDEX IF NOT EXISTS idx_contacts_company_id ON contacts(company_id);
CREATE INDEX IF NOT EXISTS idx_contacts_visitor_id ON contacts(visitor_id);
CREATE INDEX IF NOT EXISTS idx_contacts_last_interaction ON contacts(last_interaction DESC);

CREATE INDEX IF NOT EXISTS idx_conversations_company_id ON conversations(company_id);
CREATE INDEX IF NOT EXISTS idx_conversations_visitor_id ON conversations(visitor_id);
CREATE INDEX IF NOT EXISTS idx_conversations_contact_id ON conversations(contact_id);
CREATE INDEX IF NOT EXISTS idx_conversations_last_message ON conversations(last_message_at DESC);

CREATE INDEX IF NOT EXISTS idx_chat_messages_conversation_id ON chat_messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_company_id ON chat_messages(company_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_visitor_id ON chat_messages(visitor_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_created_at ON chat_messages(created_at DESC);

-- Row Level Security
ALTER TABLE contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;

-- RLS Policies for contacts
CREATE POLICY contacts_company_access ON contacts
    FOR ALL TO authenticated
    USING (company_id IN (
        SELECT c.id FROM companies c 
        WHERE c.email_1 = auth.jwt() ->> 'email'
    ));

-- RLS Policies for conversations
CREATE POLICY conversations_company_access ON conversations
    FOR ALL TO authenticated
    USING (company_id IN (
        SELECT c.id FROM companies c 
        WHERE c.email_1 = auth.jwt() ->> 'email'
    ));

-- RLS Policies for chat_messages
CREATE POLICY chat_messages_company_access ON chat_messages
    FOR ALL TO authenticated
    USING (company_id IN (
        SELECT c.id FROM companies c 
        WHERE c.email_1 = auth.jwt() ->> 'email'
    ));

-- Function to update last_interaction timestamp on contacts
CREATE OR REPLACE FUNCTION update_contact_last_interaction()
RETURNS TRIGGER AS $$
BEGIN
    -- Update contact last_interaction via conversation
    UPDATE contacts 
    SET last_interaction = NOW(), updated_at = NOW()
    WHERE id IN (
        SELECT contact_id FROM conversations 
        WHERE id = NEW.conversation_id AND contact_id IS NOT NULL
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-update contact last_interaction when new message is added
CREATE TRIGGER trigger_update_contact_interaction
    AFTER INSERT ON chat_messages
    FOR EACH ROW
    EXECUTE FUNCTION update_contact_last_interaction();

-- Function to update conversation last_message_at
CREATE OR REPLACE FUNCTION update_conversation_last_message()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE conversations 
    SET last_message_at = NOW()
    WHERE id = NEW.conversation_id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-update conversation last_message_at
CREATE TRIGGER trigger_update_conversation_message
    AFTER INSERT ON chat_messages
    FOR EACH ROW
    EXECUTE FUNCTION update_conversation_last_message();