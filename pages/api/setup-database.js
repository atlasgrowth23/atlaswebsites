import { createClient } from '@/lib/supabase/client';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Create Supabase client with service role
    const supabase = createClient(true);

    const results = [];

    // Create user_profiles table
    const { error: profilesError } = await supabase.rpc('exec_sql', {
      sql: `
        CREATE TABLE IF NOT EXISTS user_profiles (
          id SERIAL PRIMARY KEY,
          user_id UUID REFERENCES auth.users(id),
          role TEXT NOT NULL CHECK (role IN ('super_admin', 'admin', 'staff', 'business', 'demo')),
          permissions JSONB DEFAULT '{}',
          business_slug TEXT,
          created_at TIMESTAMPTZ DEFAULT NOW()
        );
      `
    });

    if (profilesError) {
      results.push({ table: 'user_profiles', success: false, error: profilesError.message });
    } else {
      results.push({ table: 'user_profiles', success: true });
    }

    // Create chat_messages table
    const { error: messagesError } = await supabase.rpc('exec_sql', {
      sql: `
        CREATE TABLE IF NOT EXISTS chat_messages (
          id SERIAL PRIMARY KEY,
          business_slug TEXT NOT NULL,
          sender_name TEXT,
          sender_email TEXT,
          message TEXT NOT NULL,
          timestamp TIMESTAMPTZ DEFAULT NOW(),
          read BOOLEAN DEFAULT FALSE,
          responded BOOLEAN DEFAULT FALSE,
          response_text TEXT,
          response_timestamp TIMESTAMPTZ
        );
      `
    });

    if (messagesError) {
      results.push({ table: 'chat_messages', success: false, error: messagesError.message });
    } else {
      results.push({ table: 'chat_messages', success: true });
    }

    // Create chat_configurations table
    const { error: configError } = await supabase.rpc('exec_sql', {
      sql: `
        CREATE TABLE IF NOT EXISTS chat_configurations (
          business_slug TEXT PRIMARY KEY,
          greeting_message TEXT DEFAULT 'Hello! How can we help you today?',
          primary_color TEXT DEFAULT '#2563eb',
          auto_responses JSONB DEFAULT '[]',
          active_hours JSONB DEFAULT '{"weekdays": "9:00-17:00", "weekend": "Closed"}',
          created_at TIMESTAMPTZ DEFAULT NOW(),
          updated_at TIMESTAMPTZ DEFAULT NOW()
        );
      `
    });

    if (configError) {
      results.push({ table: 'chat_configurations', success: false, error: configError.message });
    } else {
      results.push({ table: 'chat_configurations', success: true });
    }

    return res.status(200).json({ success: true, results });
  } catch (error) {
    console.error('Error setting up database:', error);
    return res.status(500).json({ error: error.message });
  }
}