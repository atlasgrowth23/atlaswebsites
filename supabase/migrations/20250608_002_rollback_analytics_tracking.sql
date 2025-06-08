-- Rollback: Remove enhanced analytics tracking columns
-- Rollback: 20250608_002_rollback_analytics_tracking.sql

-- Drop indexes first
DROP INDEX IF EXISTS idx_template_views_fingerprint;
DROP INDEX IF EXISTS idx_template_views_is_return_visitor;
DROP INDEX IF EXISTS idx_template_views_device_model;
DROP INDEX IF EXISTS idx_template_views_visitor_id;

-- Drop columns
ALTER TABLE template_views 
DROP COLUMN IF EXISTS is_return_visitor,
DROP COLUMN IF EXISTS page_title,
DROP COLUMN IF EXISTS touch_support,
DROP COLUMN IF EXISTS platform,
DROP COLUMN IF EXISTS language,
DROP COLUMN IF EXISTS timezone,
DROP COLUMN IF EXISTS screen_resolution,
DROP COLUMN IF EXISTS device_model,
DROP COLUMN IF EXISTS visitor_id;