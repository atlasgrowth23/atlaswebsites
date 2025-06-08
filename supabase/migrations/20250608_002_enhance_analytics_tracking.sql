-- Enhanced analytics tracking with professional visitor identification
-- Migration: 20250608_002_enhance_analytics_tracking.sql

-- Add new columns to template_views table for professional tracking
ALTER TABLE template_views 
ADD COLUMN IF NOT EXISTS visitor_id VARCHAR(255),
ADD COLUMN IF NOT EXISTS device_model VARCHAR(255),
ADD COLUMN IF NOT EXISTS screen_resolution VARCHAR(50),
ADD COLUMN IF NOT EXISTS timezone VARCHAR(100),
ADD COLUMN IF NOT EXISTS language VARCHAR(10),
ADD COLUMN IF NOT EXISTS platform VARCHAR(100),
ADD COLUMN IF NOT EXISTS touch_support BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS page_title VARCHAR(500),
ADD COLUMN IF NOT EXISTS is_return_visitor BOOLEAN DEFAULT FALSE;

-- Create indexes for performance
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_template_views_visitor_id 
ON template_views(visitor_id);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_template_views_device_model 
ON template_views(device_model);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_template_views_is_return_visitor 
ON template_views(is_return_visitor);

-- Create composite index for unique visitor detection
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_template_views_fingerprint 
ON template_views(company_id, screen_resolution, timezone, platform);