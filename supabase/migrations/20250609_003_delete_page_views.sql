-- Migration: Remove page_views table (redundant tracking)
-- Date: 2025-06-09
-- Description: Remove page_views table that is completely redundant with template_views

-- page_views table (16 records) is completely redundant:
-- - Basic tracking: company_id, page_url, referrer, device_type, user_agent, viewed_at
-- - template_views provides ALL the same data PLUS much more:
--   * Session tracking, time analytics, device fingerprinting
--   * Return visitor detection, geo-location, advanced metrics
-- - Admin analytics uses ONLY template_views
-- - No production APIs reference page_views

-- Drop redundant table
DROP TABLE IF EXISTS page_views CASCADE;

-- Note: contact_log preserved for manual review (93 records with stage transition data)