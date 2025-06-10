-- Migration: Remove prospect_tracking table (empty, unused)
-- Date: 2025-06-09
-- Description: Cleanup phase 2 - Remove prospect_tracking table that had API but no data

-- prospect_tracking table was confirmed empty (0 rows)
-- It has an API endpoint at /pages/api/prospect-tracking.ts but was never used in production
-- The functionality is better covered by the contacts table in the chat system

-- Drop empty prospect_tracking table
DROP TABLE IF EXISTS prospect_tracking CASCADE;

-- Note: prospect_visits and tracking_data tables were checked but did not exist