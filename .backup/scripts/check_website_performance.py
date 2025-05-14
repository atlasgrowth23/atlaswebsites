#!/usr/bin/env python3
import os
import requests
import json
import psycopg2
import time
from urllib.parse import urlparse
from dotenv import load_dotenv

# Load environment variables
load_dotenv('.env.local')

# Configuration
API_KEY = "YOUR_GOOGLE_API_KEY"  # Get a free API key from Google Cloud Console
BATCH_SIZE = 5  # Process sites in batches
DELAY_BETWEEN_REQUESTS = 2  # Seconds to wait between API calls

# Connect to the database
def get_db_connection():
    conn = psycopg2.connect(os.getenv("DATABASE_URL"))
    conn.autocommit = True
    return conn

# Create the performance_metrics table if it doesn't exist
def create_metrics_table(conn):
    with conn.cursor() as cur:
        cur.execute("""
        CREATE TABLE IF NOT EXISTS website_performance (
            id SERIAL PRIMARY KEY,
            company_id TEXT,
            site_url TEXT UNIQUE,
            last_checked TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            
            -- Core Web Vitals
            mobile_performance_score INTEGER,
            desktop_performance_score INTEGER,
            largest_contentful_paint FLOAT,
            first_input_delay FLOAT,
            cumulative_layout_shift FLOAT,
            
            -- SEO Metrics
            mobile_seo_score INTEGER,
            desktop_seo_score INTEGER,
            
            -- Accessibility
            mobile_accessibility_score INTEGER,
            desktop_accessibility_score INTEGER,
            
            -- Best Practices
            mobile_best_practices_score INTEGER,
            desktop_best_practices_score INTEGER,
            
            -- Schema.org detection
            has_schema_org BOOLEAN DEFAULT FALSE,
            
            -- Raw data
            pagespeed_data JSONB
        );
        
        -- Add index on company_id for faster lookups
        CREATE INDEX IF NOT EXISTS idx_website_performance_company_id ON website_performance(company_id);
        """)
        print("Website performance table created or already exists")

# Get all companies with website URLs
def get_companies_with_sites(conn):
    with conn.cursor() as cur:
        cur.execute("""
        SELECT id, name, site 
        FROM companies
        WHERE site IS NOT NULL 
          AND site != ''
          AND site != 'http://'
          AND site != 'https://'
          AND site NOT LIKE '%facebook.com%'
          AND site NOT LIKE '%yelp.com%'
          AND site NOT LIKE '%yellowpages.com%'
        """)
        return cur.fetchall()

# Check if URL is valid and normalize it
def normalize_url(url):
    if not url:
        return None
    
    if not url.startswith(('http://', 'https://')):
        url = 'https://' + url
    
    try:
        parsed = urlparse(url)
        if not parsed.netloc:
            return None
        return url
    except:
        return None

# Run PageSpeed Insights API for a URL
def check_pagespeed(url):
    try:
        # Mobile
        mobile_response = requests.get(
            f"https://www.googleapis.com/pagespeedonline/v5/runPagespeed?url={url}&strategy=mobile&key={API_KEY}"
        )
        mobile_data = mobile_response.json()
        
        time.sleep(DELAY_BETWEEN_REQUESTS)  # Delay to respect API rate limits
        
        # Desktop
        desktop_response = requests.get(
            f"https://www.googleapis.com/pagespeedonline/v5/runPagespeed?url={url}&strategy=desktop&key={API_KEY}"
        )
        desktop_data = desktop_response.json()
        
        # Extract metrics
        result = {
            "mobile": {
                "performance": int(mobile_data.get("lighthouseResult", {}).get("categories", {}).get("performance", {}).get("score", 0) * 100),
                "seo": int(mobile_data.get("lighthouseResult", {}).get("categories", {}).get("seo", {}).get("score", 0) * 100),
                "accessibility": int(mobile_data.get("lighthouseResult", {}).get("categories", {}).get("accessibility", {}).get("score", 0) * 100),
                "best_practices": int(mobile_data.get("lighthouseResult", {}).get("categories", {}).get("best-practices", {}).get("score", 0) * 100),
            },
            "desktop": {
                "performance": int(desktop_data.get("lighthouseResult", {}).get("categories", {}).get("performance", {}).get("score", 0) * 100),
                "seo": int(desktop_data.get("lighthouseResult", {}).get("categories", {}).get("seo", {}).get("score", 0) * 100),
                "accessibility": int(desktop_data.get("lighthouseResult", {}).get("categories", {}).get("accessibility", {}).get("score", 0) * 100),
                "best_practices": int(desktop_data.get("lighthouseResult", {}).get("categories", {}).get("best-practices", {}).get("score", 0) * 100),
            },
            "metrics": {
                "lcp": mobile_data.get("lighthouseResult", {}).get("audits", {}).get("largest-contentful-paint", {}).get("numericValue", 0) / 1000,
                "fid": mobile_data.get("lighthouseResult", {}).get("audits", {}).get("max-potential-fid", {}).get("numericValue", 0) / 1000,
                "cls": mobile_data.get("lighthouseResult", {}).get("audits", {}).get("cumulative-layout-shift", {}).get("numericValue", 0),
            },
            "raw": {
                "mobile": mobile_data,
                "desktop": desktop_data
            }
        }
        
        return result
    except Exception as e:
        print(f"Error checking PageSpeed for {url}: {e}")
        return None

# Check if site has schema.org structured data
def check_schema_org(url):
    try:
        response = requests.get(url, timeout=10)
        html = response.text.lower()
        
        # Check for schema.org markup in different formats
        has_schema = (
            'schema.org' in html or
            'itemtype="http://schema.org' in html or
            'itemtype="https://schema.org' in html or
            'application/ld+json' in html
        )
        
        return has_schema
    except Exception as e:
        print(f"Error checking schema.org for {url}: {e}")
        return False

# Save metrics to database
def save_metrics(conn, company_id, site_url, metrics, has_schema):
    with conn.cursor() as cur:
        cur.execute("""
        INSERT INTO website_performance (
            company_id, site_url, mobile_performance_score, desktop_performance_score,
            largest_contentful_paint, first_input_delay, cumulative_layout_shift,
            mobile_seo_score, desktop_seo_score, mobile_accessibility_score,
            desktop_accessibility_score, mobile_best_practices_score,
            desktop_best_practices_score, has_schema_org, pagespeed_data
        ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
        ON CONFLICT (site_url) 
        DO UPDATE SET
            mobile_performance_score = EXCLUDED.mobile_performance_score,
            desktop_performance_score = EXCLUDED.desktop_performance_score,
            largest_contentful_paint = EXCLUDED.largest_contentful_paint,
            first_input_delay = EXCLUDED.first_input_delay,
            cumulative_layout_shift = EXCLUDED.cumulative_layout_shift,
            mobile_seo_score = EXCLUDED.mobile_seo_score,
            desktop_seo_score = EXCLUDED.desktop_seo_score,
            mobile_accessibility_score = EXCLUDED.mobile_accessibility_score,
            desktop_accessibility_score = EXCLUDED.desktop_accessibility_score,
            mobile_best_practices_score = EXCLUDED.mobile_best_practices_score,
            desktop_best_practices_score = EXCLUDED.desktop_best_practices_score,
            has_schema_org = EXCLUDED.has_schema_org,
            pagespeed_data = EXCLUDED.pagespeed_data,
            last_checked = NOW()
        """, (
            company_id,
            site_url,
            metrics["mobile"]["performance"],
            metrics["desktop"]["performance"],
            metrics["metrics"]["lcp"],
            metrics["metrics"]["fid"],
            metrics["metrics"]["cls"],
            metrics["mobile"]["seo"],
            metrics["desktop"]["seo"],
            metrics["mobile"]["accessibility"],
            metrics["desktop"]["accessibility"],
            metrics["mobile"]["best_practices"],
            metrics["desktop"]["best_practices"],
            has_schema,
            json.dumps(metrics["raw"])
        ))

# Main function
def main():
    # Set up
    print("Starting website performance check...")
    conn = get_db_connection()
    create_metrics_table(conn)
    
    # Get companies with websites
    companies = get_companies_with_sites(conn)
    print(f"Found {len(companies)} companies with websites")
    
    # Process in batches
    processed = 0
    success = 0
    errors = 0
    
    for i in range(0, len(companies), BATCH_SIZE):
        batch = companies[i:i+BATCH_SIZE]
        print(f"Processing batch {i//BATCH_SIZE + 1} ({i+1}-{min(i+BATCH_SIZE, len(companies))} of {len(companies)})")
        
        for company_id, company_name, site_url in batch:
            processed += 1
            
            # Normalize URL
            normalized_url = normalize_url(site_url)
            if not normalized_url:
                print(f"Skipping invalid URL for {company_name}: {site_url}")
                errors += 1
                continue
            
            print(f"Checking {normalized_url} for {company_name}...")
            
            try:
                # Check PageSpeed
                metrics = check_pagespeed(normalized_url)
                if not metrics:
                    print(f"Failed to get PageSpeed metrics for {normalized_url}")
                    errors += 1
                    continue
                
                # Check Schema.org
                has_schema = check_schema_org(normalized_url)
                
                # Save to database
                save_metrics(conn, company_id, normalized_url, metrics, has_schema)
                
                print(f"Saved metrics for {company_name}")
                print(f"  Performance: Mobile {metrics['mobile']['performance']}, Desktop {metrics['desktop']['performance']}")
                print(f"  Core Web Vitals: LCP {metrics['metrics']['lcp']:.2f}s, FID {metrics['metrics']['fid']:.2f}s, CLS {metrics['metrics']['cls']:.2f}")
                print(f"  Schema.org: {'Yes' if has_schema else 'No'}")
                
                success += 1
                
            except Exception as e:
                print(f"Error processing {normalized_url}: {e}")
                errors += 1
            
            # Add a delay between requests
            time.sleep(DELAY_BETWEEN_REQUESTS)
        
        print(f"Batch complete. Waiting before next batch...")
        time.sleep(DELAY_BETWEEN_REQUESTS * 2)
    
    # Summary
    print("\n=== SUMMARY ===")
    print(f"Processed {processed} websites")
    print(f"Successfully analyzed: {success}")
    print(f"Errors: {errors}")
    
    # Get some stats from the database
    with conn.cursor() as cur:
        cur.execute("""
        SELECT 
            COUNT(*) as total,
            AVG(mobile_performance_score) as avg_mobile_score,
            SUM(CASE WHEN mobile_performance_score < 50 THEN 1 ELSE 0 END) as poor_mobile,
            SUM(CASE WHEN has_schema_org THEN 1 ELSE 0 END) as with_schema
        FROM website_performance
        """)
        stats = cur.fetchone()
        
        print(f"\nDatabase Stats:")
        print(f"Total websites analyzed: {stats[0]}")
        print(f"Average mobile performance score: {stats[1]:.1f}/100")
        print(f"Poor mobile performance (<50): {stats[2]} ({stats[2]/stats[0]*100:.1f}%)")
        print(f"With schema.org markup: {stats[3]} ({stats[3]/stats[0]*100:.1f}%)")
    
    conn.close()
    print("Done!")

if __name__ == "__main__":
    main()