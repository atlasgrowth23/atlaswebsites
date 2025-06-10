-- Rollback for legacy drop migration
-- Note: Cannot restore deleted demo data, only recreate table structure

-- Recreate legacy tables (minimal structure for reference)
CREATE TABLE IF NOT EXISTS hvacdashboard_contacts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT,
  email TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS hvacdashboard_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contact_id UUID,
  content TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS hvacdashboard_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS client_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Note: Demo data cannot be restored - was permanently deleted