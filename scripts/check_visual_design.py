#!/usr/bin/env python3
import os
import requests
import json
import psycopg2
import time
import logging
from urllib.parse import urlparse
from dotenv import load_dotenv
from datetime import datetime

# Load environment variables
load_dotenv('.env.local')

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler("visual_design_check.log"),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger(__name__)

# Configuration - replace with your actual API keys
CONFIG = {
    "screenshot_api_key": "YOUR_API_KEY",  # For a service like ScreenshotAPI or similar
    "batch_size": 10,
    "delay_between_requests": 3,
    "screenshot_width": 1280,
    "screenshot_height": 800
}

# Connect to the database
def get_db_connection():
    conn = psycopg2.connect(os.getenv("DATABASE_URL"))
    conn.autocommit = True
    return conn

# Create the visual design metrics table if it doesn't exist
def create_metrics_table(conn):
    with conn.cursor() as cur:
        cur.execute("""
        CREATE TABLE IF NOT EXISTS website_design (
            id SERIAL PRIMARY KEY,
            company_id TEXT,
            site_url TEXT UNIQUE,
            last_checked TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            
            -- Design evaluation
            design_score INTEGER,  -- 0-100 score (can be derived from other metrics)
            seems_outdated BOOLEAN,
            responsive_design BOOLEAN,
            modern_aesthetics BOOLEAN,
            consistent_branding BOOLEAN,
            clear_navigation BOOLEAN,
            mobile_friendly BOOLEAN,
            
            -- Visual elements
            has_logo BOOLEAN,
            has_hero_section BOOLEAN,
            has_testimonials BOOLEAN,
            has_clear_cta BOOLEAN,
            has_service_listings BOOLEAN,
            has_contact_form BOOLEAN,
            
            -- Technical aspects
            uses_cms VARCHAR(50),  -- WordPress, Wix, Custom, etc.
            estimated_age INTEGER,  -- Approximate site age in years
            
            -- Screenshots
            desktop_screenshot_url TEXT,
            mobile_screenshot_url TEXT,
            
            -- Notes
            design_notes TEXT,
            
            -- Raw data 
            raw_data JSONB
        );
        
        -- Add index on company_id for faster lookups
        CREATE INDEX IF NOT EXISTS idx_website_design_company_id ON website_design(company_id);
        """)
        logger.info("Website design table created or already exists")

# Get companies with websites that haven't been analyzed yet
def get_companies_to_analyze(conn, limit=100):
    with conn.cursor() as cur:
        cur.execute("""
        SELECT c.id, c.name, c.site 
        FROM companies c
        LEFT JOIN website_design wd ON c.id = wd.company_id
        WHERE c.site IS NOT NULL 
          AND c.site != ''
          AND c.site != 'http://'
          AND c.site != 'https://'
          AND c.site NOT LIKE '%facebook.com%'
          AND c.site NOT LIKE '%yelp.com%'
          AND c.site NOT LIKE '%yellowpages.com%'
          AND wd.id IS NULL
        LIMIT %s
        """, (limit,))
        return cur.fetchall()

# Normalize URL
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

# Take screenshots of the website (desktop and mobile)
def take_screenshots(url):
    # This is a placeholder. You'd integrate with a service like ScreenshotAPI,
    # Urlbox, or similar to get actual screenshots.
    
    # Sample implementation using a hypothetical screenshot service
    try:
        # Desktop screenshot
        desktop_params = {
            "access_key": CONFIG["screenshot_api_key"],
            "url": url,
            "width": CONFIG["screenshot_width"],
            "height": CONFIG["screenshot_height"],
            "output": "json",
            "full_page": True
        }
        
        # This is where you'd make the API call - commented out since it's not real
        # desktop_response = requests.get("https://api.screenshotapi.net/screenshot", params=desktop_params)
        # desktop_data = desktop_response.json()
        # desktop_screenshot_url = desktop_data["screenshot_url"]
        
        # Mobile screenshot 
        mobile_params = {
            "access_key": CONFIG["screenshot_api_key"],
            "url": url,
            "width": 375,
            "height": 812,
            "output": "json",
            "full_page": True,
            "user_agent": "Mozilla/5.0 (iPhone; CPU iPhone OS 12_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/12.0 Mobile/15E148 Safari/604.1"
        }
        
        # mobile_response = requests.get("https://api.screenshotapi.net/screenshot", params=mobile_params)
        # mobile_data = mobile_response.json()
        # mobile_screenshot_url = mobile_data["screenshot_url"]
        
        # For demonstration, return placeholder URLs
        desktop_screenshot_url = f"https://storage.googleapis.com/screenshots/{urlparse(url).netloc}_desktop.png"
        mobile_screenshot_url = f"https://storage.googleapis.com/screenshots/{urlparse(url).netloc}_mobile.png"
        
        return {
            "desktop": desktop_screenshot_url,
            "mobile": mobile_screenshot_url
        }
        
    except Exception as e:
        logger.error(f"Error taking screenshots for {url}: {e}")
        return None

# Check website design using various heuristics
def analyze_website_design(url):
    try:
        # Fetch the website
        headers = {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36"
        }
        response = requests.get(url, headers=headers, timeout=15)
        html = response.text.lower()
        
        # Design metrics (these are simplified heuristics - in practice you'd use more sophisticated methods)
        metrics = {
            # Responsive design check
            "responsive_design": (
                'viewport' in html and 
                'meta name="viewport"' in html
            ),
            
            # Modern framework detection
            "modern_aesthetics": any(framework in html for framework in [
                'bootstrap', 'tailwind', 'foundation', 'materialize', 'bulma',
                'react', 'vue', 'angular', 'jquery'
            ]),
            
            # Clear navigation check
            "clear_navigation": (
                '<nav' in html or 
                'class="nav' in html or
                'id="nav' in html or 
                'class="menu' in html
            ),
            
            # Logo check
            "has_logo": (
                'logo' in html and
                ('<img' in html or '.svg' in html)
            ),
            
            # Hero section check
            "has_hero_section": any(term in html for term in [
                'hero', 'banner', 'jumbotron', 'carousel', 'slider'
            ]),
            
            # Testimonials check
            "has_testimonials": any(term in html for term in [
                'testimonial', 'review', 'rating', 'star', 'client'
            ]),
            
            # CTA check
            "has_clear_cta": (
                'contact' in html and
                ('button' in html or 'btn' in html or 'call' in html)
            ),
            
            # Service listings
            "has_service_listings": any(term in html for term in [
                'service', 'repair', 'maintenance', 'installation', 'hvac', 'heating', 'cooling'
            ]),
            
            # Contact form
            "has_contact_form": (
                'contact' in html and 
                'form' in html and
                ('input' in html or 'textarea' in html)
            ),
            
            # CMS detection
            "uses_cms": detect_cms(html, url)
        }
        
        # Calculate an overall design score (simplified example)
        design_score = 0
        
        # Add points for each positive design element
        if metrics["responsive_design"]: design_score += 15
        if metrics["modern_aesthetics"]: design_score += 15
        if metrics["clear_navigation"]: design_score += 10
        if metrics["has_logo"]: design_score += 10
        if metrics["has_hero_section"]: design_score += 10
        if metrics["has_testimonials"]: design_score += 10
        if metrics["has_clear_cta"]: design_score += 10
        if metrics["has_service_listings"]: design_score += 10
        if metrics["has_contact_form"]: design_score += 10
        
        # Age penalty
        if metrics["uses_cms"] == "Unknown" or metrics["uses_cms"] == "Custom/Old":
            design_score -= 10
        
        # Cap the score
        design_score = max(0, min(100, design_score))
        
        # Add the score and outdated assessment
        metrics["design_score"] = design_score
        metrics["seems_outdated"] = design_score < 50
        metrics["mobile_friendly"] = metrics["responsive_design"]
        metrics["consistent_branding"] = metrics["has_logo"]
        metrics["estimated_age"] = estimate_site_age(html, url, metrics["uses_cms"])
        
        # Add design notes
        metrics["design_notes"] = generate_design_notes(metrics)
        
        return metrics
        
    except Exception as e:
        logger.error(f"Error analyzing design for {url}: {e}")
        return None

# Detect what CMS the site is using
def detect_cms(html, url):
    # WordPress
    if 'wp-content' in html or 'wp-includes' in html or 'wordpress' in html:
        return "WordPress"
    
    # Wix
    elif 'wix.com' in html or 'wixsite.com' in url:
        return "Wix"
    
    # Squarespace
    elif 'squarespace.com' in html or 'sqsp.net' in url:
        return "Squarespace"
    
    # Shopify
    elif 'shopify.com' in html or 'cdn.shopify.com' in html:
        return "Shopify"
    
    # Weebly
    elif 'weebly.com' in html or 'weebly.com' in url:
        return "Weebly"
    
    # Check for modern frameworks
    elif any(framework in html for framework in ['react', 'vue', 'angular', 'next.js']):
        return "Modern Custom"
    
    # Check for older technologies
    elif any(tech in html for tech in ['jquery', 'bootstrap 3', 'bootstrap 2']):
        return "Custom/Older"
    
    return "Unknown"

# Estimate the approximate age of the website
def estimate_site_age(html, url, cms):
    # This is a very rough estimate based on technologies used
    
    # If using old technologies, estimate older
    if any(old_tech in html for old_tech in [
        'jquery-1.', 'bootstrap 2', 'html4', 'table layout', 'font face="'
    ]):
        return 8
    
    # If using slightly older technologies
    elif any(tech in html for tech in [
        'jquery-2.', 'bootstrap 3', 'fontawesome 4'
    ]):
        return 5
    
    # If using modern technologies
    elif any(tech in html for tech in [
        'bootstrap 4', 'bootstrap 5', 'tailwind', 'react', 'vue', 'angular',
        'font-awesome 5', 'fontawesome 5', 'webp'
    ]):
        return 2
    
    # Default - middle age
    return 4

# Generate human-readable notes about the design
def generate_design_notes(metrics):
    notes = []
    
    # Overall assessment
    if metrics["design_score"] >= 80:
        notes.append("Modern, professional design with good user experience elements.")
    elif metrics["design_score"] >= 60:
        notes.append("Reasonably modern design with some room for improvement.")
    elif metrics["design_score"] >= 40:
        notes.append("Somewhat dated design that could benefit from modernization.")
    else:
        notes.append("Outdated design that would benefit significantly from a redesign.")
    
    # CMS notes
    notes.append(f"Built with {metrics['uses_cms']}.")
    
    # Mobile responsiveness
    if metrics["responsive_design"]:
        notes.append("Mobile-responsive design detected.")
    else:
        notes.append("No mobile-responsive design elements found - likely not optimized for mobile devices.")
    
    # Missing elements
    missing = []
    if not metrics["has_hero_section"]: missing.append("hero section")
    if not metrics["has_testimonials"]: missing.append("testimonials")
    if not metrics["has_clear_cta"]: missing.append("clear call-to-action")
    if not metrics["has_service_listings"]: missing.append("service listings")
    if not metrics["has_contact_form"]: missing.append("contact form")
    
    if missing:
        notes.append(f"Missing key elements: {', '.join(missing)}.")
    
    # Age note
    notes.append(f"Site appears to be approximately {metrics['estimated_age']} years old in design style.")
    
    return " ".join(notes)

# Save website design data to database
def save_design_data(conn, company_id, site_url, design_metrics, screenshots):
    with conn.cursor() as cur:
        cur.execute("""
        INSERT INTO website_design (
            company_id, site_url, design_score, seems_outdated,
            responsive_design, modern_aesthetics, consistent_branding,
            clear_navigation, mobile_friendly, has_logo, has_hero_section,
            has_testimonials, has_clear_cta, has_service_listings,
            has_contact_form, uses_cms, estimated_age,
            desktop_screenshot_url, mobile_screenshot_url,
            design_notes, raw_data
        ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
        ON CONFLICT (site_url) 
        DO UPDATE SET
            design_score = EXCLUDED.design_score,
            seems_outdated = EXCLUDED.seems_outdated,
            responsive_design = EXCLUDED.responsive_design,
            modern_aesthetics = EXCLUDED.modern_aesthetics,
            consistent_branding = EXCLUDED.consistent_branding,
            clear_navigation = EXCLUDED.clear_navigation,
            mobile_friendly = EXCLUDED.mobile_friendly,
            has_logo = EXCLUDED.has_logo,
            has_hero_section = EXCLUDED.has_hero_section,
            has_testimonials = EXCLUDED.has_testimonials,
            has_clear_cta = EXCLUDED.has_clear_cta,
            has_service_listings = EXCLUDED.has_service_listings,
            has_contact_form = EXCLUDED.has_contact_form,
            uses_cms = EXCLUDED.uses_cms,
            estimated_age = EXCLUDED.estimated_age,
            desktop_screenshot_url = EXCLUDED.desktop_screenshot_url,
            mobile_screenshot_url = EXCLUDED.mobile_screenshot_url,
            design_notes = EXCLUDED.design_notes,
            raw_data = EXCLUDED.raw_data,
            last_checked = NOW()
        """, (
            company_id,
            site_url,
            design_metrics.get("design_score", 0),
            design_metrics.get("seems_outdated", True),
            design_metrics.get("responsive_design", False),
            design_metrics.get("modern_aesthetics", False),
            design_metrics.get("consistent_branding", False),
            design_metrics.get("clear_navigation", False),
            design_metrics.get("mobile_friendly", False),
            design_metrics.get("has_logo", False),
            design_metrics.get("has_hero_section", False),
            design_metrics.get("has_testimonials", False),
            design_metrics.get("has_clear_cta", False),
            design_metrics.get("has_service_listings", False),
            design_metrics.get("has_contact_form", False),
            design_metrics.get("uses_cms", "Unknown"),
            design_metrics.get("estimated_age", 5),
            screenshots.get("desktop") if screenshots else None,
            screenshots.get("mobile") if screenshots else None,
            design_metrics.get("design_notes", ""),
            json.dumps(design_metrics)
        ))

# Main function
def main():
    logger.info("Starting website design analysis...")
    conn = get_db_connection()
    create_metrics_table(conn)
    
    # Get companies to analyze
    companies = get_companies_to_analyze(conn, limit=100)
    logger.info(f"Found {len(companies)} companies to analyze")
    
    # Process in batches
    processed = 0
    success = 0
    errors = 0
    
    for i in range(0, len(companies), CONFIG["batch_size"]):
        batch = companies[i:i+CONFIG["batch_size"]]
        logger.info(f"Processing batch {i//CONFIG['batch_size'] + 1} ({i+1}-{min(i+CONFIG['batch_size'], len(companies))} of {len(companies)})")
        
        for company_id, company_name, site_url in batch:
            processed += 1
            
            # Normalize URL
            normalized_url = normalize_url(site_url)
            if not normalized_url:
                logger.warning(f"Skipping invalid URL for {company_name}: {site_url}")
                errors += 1
                continue
            
            logger.info(f"Analyzing design for {normalized_url} ({company_name})...")
            
            try:
                # Analyze website design
                design_metrics = analyze_website_design(normalized_url)
                if not design_metrics:
                    logger.error(f"Failed to analyze design for {normalized_url}")
                    errors += 1
                    continue
                
                # Take screenshots
                screenshots = take_screenshots(normalized_url)
                
                # Save to database
                save_design_data(conn, company_id, normalized_url, design_metrics, screenshots)
                
                logger.info(f"Saved design analysis for {company_name}")
                logger.info(f"  Design Score: {design_metrics.get('design_score', 0)}/100")
                logger.info(f"  CMS: {design_metrics.get('uses_cms', 'Unknown')}")
                logger.info(f"  Estimated Age: ~{design_metrics.get('estimated_age', 5)} years")
                logger.info(f"  Notes: {design_metrics.get('design_notes', '')}")
                
                success += 1
                
            except Exception as e:
                logger.error(f"Error processing {normalized_url}: {e}")
                errors += 1
            
            # Add a delay between requests
            time.sleep(CONFIG["delay_between_requests"])
        
        logger.info(f"Batch complete. Waiting before next batch...")
        time.sleep(CONFIG["delay_between_requests"] * 2)
    
    # Summary
    logger.info("\n=== SUMMARY ===")
    logger.info(f"Processed {processed} websites")
    logger.info(f"Successfully analyzed: {success}")
    logger.info(f"Errors: {errors}")
    
    # Get some stats from the database
    with conn.cursor() as cur:
        cur.execute("""
        SELECT 
            COUNT(*) as total,
            AVG(design_score) as avg_score,
            SUM(CASE WHEN seems_outdated THEN 1 ELSE 0 END) as outdated,
            SUM(CASE WHEN mobile_friendly THEN 1 ELSE 0 END) as mobile_friendly
        FROM website_design
        """)
        stats = cur.fetchone()
        
        logger.info(f"\nDatabase Stats:")
        logger.info(f"Total websites analyzed: {stats[0]}")
        logger.info(f"Average design score: {stats[1]:.1f}/100")
        logger.info(f"Outdated websites: {stats[2]} ({stats[2]/stats[0]*100:.1f}%)")
        logger.info(f"Mobile-friendly websites: {stats[3]} ({stats[3]/stats[0]*100:.1f}%)")
    
    conn.close()
    logger.info("Done!")

if __name__ == "__main__":
    main()