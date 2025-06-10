-- Drop legacy dashboard tables for Atlas Phase 1
-- This removes old dashboard-specific tables

-- Drop legacy tables (if they exist)
DROP TABLE IF EXISTS hvacdashboard_contacts CASCADE;
DROP TABLE IF EXISTS hvacdashboard_messages CASCADE;
DROP TABLE IF EXISTS hvacdashboard_sessions CASCADE;
DROP TABLE IF EXISTS conversations CASCADE;
DROP TABLE IF EXISTS client_users CASCADE;

-- Note: Keeping existing admin CRM tables (companies, customers, etc.) untouched