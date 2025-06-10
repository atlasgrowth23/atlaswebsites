-- Migration: Remove empty redundant tables from Atlas Websites database
-- Date: 2025-06-09
-- Description: Cleanup phase 1 - Remove confirmed empty tables (leads, lead_activity)

-- These tables were confirmed empty and redundant with existing functionality:
-- - leads table: functionality covered by lead_pipeline 
-- - lead_activity table: functionality covered by activity_log

-- Drop empty tables
DROP TABLE IF EXISTS leads CASCADE;
DROP TABLE IF EXISTS lead_activity CASCADE;

-- Note: The following tables were preserved as they contain data:
-- - page_views (16 rows) - needs evaluation against template_views
-- - lead_notes (144 rows) - needs migration to lead_pipeline.notes 
-- - contact_log (93 rows) - needs evaluation against activity_log
-- - daily_analytics (70 rows) - needs evaluation for continued use