#!/usr/bin/env python3
import os
import requests
import json
import psycopg2
import time
import re
import logging
from urllib.parse import urlparse, quote
from bs4 import BeautifulSoup
from dotenv import load_dotenv
from datetime import datetime

# Load environment variables
load_dotenv('.env.local')

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler("seo_analysis.log"),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger(__name__)

# Configuration
CONFIG = {
    "batch_size": 5,
    "delay_between_requests": 3,
    "user_agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36"
}

# Connect to the database
def get_db_connection():
    conn = psycopg2.connect(os.getenv("DATABASE_URL"))
    conn.autocommit = True
    return conn

# Create the SEO metrics table if it doesn't exist
def create_seo_table(conn):
    with conn.cursor() as cur:
        cur.execute("""
        CREATE TABLE IF NOT EXISTS website_seo (
            id SERIAL PRIMARY KEY,
            company_id TEXT,
            site_url TEXT UNIQUE,
            last_checked TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            
            -- Schema.org
            has_schema_org BOOLEAN DEFAULT FALSE,
            schema_org_types TEXT[],
            
            -- Basic SEO elements
            has_title_tag BOOLEAN DEFAULT FALSE,
            has_meta_description BOOLEAN DEFAULT FALSE,
            has_h1_tag BOOLEAN DEFAULT FALSE,
            has_canonical_tag BOOLEAN DEFAULT FALSE,
            has_favicon BOOLEAN DEFAULT FALSE,
            
            -- Content metrics
            word_count INTEGER DEFAULT 0,
            heading_count INTEGER DEFAULT 0,
            image_count INTEGER DEFAULT 0,
            images_with_alt_count INTEGER DEFAULT 0,
            internal_link_count INTEGER DEFAULT 0,
            external_link_count INTEGER DEFAULT 0,
            
            -- SEO scores
            title_score INTEGER DEFAULT 0,  -- 0-100
            meta_description_score INTEGER DEFAULT 0, -- 0-100
            content_score INTEGER DEFAULT 0, -- 0-100
            overall_seo_score INTEGER DEFAULT 0, -- 0-100
            
            -- Keywords
            top_keywords TEXT[],
            
            -- Issues
            seo_issues TEXT[],
            
            -- Social media
            has_facebook BOOLEAN DEFAULT FALSE,
            has_twitter BOOLEAN DEFAULT FALSE,
            has_instagram BOOLEAN DEFAULT FALSE,
            has_linkedin BOOLEAN DEFAULT FALSE,
            has_google_business BOOLEAN DEFAULT FALSE,
            
            -- Technical
            page_load_time_seconds FLOAT,
            is_secure BOOLEAN DEFAULT FALSE,
            has_sitemap BOOLEAN DEFAULT FALSE,
            has_robots_txt BOOLEAN DEFAULT FALSE,
            
            -- Raw data
            title_text TEXT,
            meta_description_text TEXT,
            h1_text TEXT,
            raw_data JSONB
        );
        
        -- Add index on company_id for faster lookups
        CREATE INDEX IF NOT EXISTS idx_website_seo_company_id ON website_seo(company_id);
        """)
        logger.info("Website SEO table created or already exists")

# Get companies with websites that haven't been analyzed for SEO
def get_companies_to_analyze(conn, limit=50):
    with conn.cursor() as cur:
        cur.execute("""
        SELECT c.id, c.name, c.site 
        FROM companies c
        LEFT JOIN website_seo ws ON c.id = ws.company_id
        WHERE c.site IS NOT NULL 
          AND c.site != ''
          AND c.site != 'http://'
          AND c.site != 'https://'
          AND c.site NOT LIKE '%facebook.com%'
          AND c.site NOT LIKE '%yelp.com%'
          AND c.site NOT LIKE '%yellowpages.com%'
          AND ws.id IS NULL
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

# Check if a URL exists
def url_exists(url):
    try:
        response = requests.head(url, timeout=5)
        return response.status_code < 400
    except:
        return False

# Analyze Schema.org implementation
def check_schema_org(soup, html):
    schema_data = {
        "has_schema_org": False,
        "schema_org_types": []
    }
    
    # Check JSON-LD
    script_tags = soup.find_all('script', {'type': 'application/ld+json'})
    for script in script_tags:
        try:
            content = script.string
            if content and 'schema.org' in content:
                schema_data["has_schema_org"] = True
                
                # Extract types
                json_content = json.loads(content)
                if '@type' in json_content:
                    schema_data["schema_org_types"].append(json_content['@type'])
                elif '@graph' in json_content:
                    for item in json_content['@graph']:
                        if '@type' in item:
                            schema_data["schema_org_types"].append(item['@type'])
        except:
            pass
    
    # Check microdata
    if not schema_data["has_schema_org"]:
        microdata_elements = soup.find_all(attrs={"itemtype": True})
        for element in microdata_elements:
            if 'schema.org' in element.get('itemtype', ''):
                schema_data["has_schema_org"] = True
                schema_type = element.get('itemtype', '').split('schema.org/')[1]
                schema_data["schema_org_types"].append(schema_type)
    
    # Check RDFa
    if not schema_data["has_schema_org"]:
        rdfa_elements = soup.find_all(attrs={"typeof": True})
        for element in rdfa_elements:
            if 'schema.org' in element.get('typeof', ''):
                schema_data["has_schema_org"] = True
                schema_type = element.get('typeof', '').split('schema.org/')[1]
                schema_data["schema_org_types"].append(schema_type)
    
    # Final check in case we missed something
    if not schema_data["has_schema_org"] and 'schema.org' in html:
        schema_data["has_schema_org"] = True
    
    return schema_data

# Analyze SEO basics
def analyze_seo_basics(soup, url):
    seo_data = {}
    
    # Title tag
    title_tag = soup.find('title')
    seo_data["has_title_tag"] = title_tag is not None
    seo_data["title_text"] = title_tag.string.strip() if title_tag else None
    
    # Meta description
    meta_desc = soup.find('meta', attrs={'name': 'description'})
    seo_data["has_meta_description"] = meta_desc is not None
    seo_data["meta_description_text"] = meta_desc['content'].strip() if meta_desc else None
    
    # H1 tag
    h1_tag = soup.find('h1')
    seo_data["has_h1_tag"] = h1_tag is not None
    seo_data["h1_text"] = h1_tag.get_text().strip() if h1_tag else None
    
    # Canonical tag
    canonical = soup.find('link', attrs={'rel': 'canonical'})
    seo_data["has_canonical_tag"] = canonical is not None
    
    # Favicon
    favicon = soup.find('link', attrs={'rel': lambda r: r and ('icon' in r or 'shortcut icon' in r)})
    seo_data["has_favicon"] = favicon is not None
    
    # SSL security
    seo_data["is_secure"] = url.startswith("https://")
    
    # Check robots.txt
    parsed_url = urlparse(url)
    base_url = f"{parsed_url.scheme}://{parsed_url.netloc}"
    seo_data["has_robots_txt"] = url_exists(f"{base_url}/robots.txt")
    
    # Check sitemap
    seo_data["has_sitemap"] = (
        url_exists(f"{base_url}/sitemap.xml") or
        url_exists(f"{base_url}/sitemap_index.xml") or
        url_exists(f"{base_url}/sitemap.xml.gz")
    )
    
    return seo_data

# Analyze content metrics
def analyze_content(soup):
    content_data = {}
    
    # Word count (simplified)
    text = soup.get_text()
    words = len(re.findall(r'\b\w+\b', text))
    content_data["word_count"] = words
    
    # Heading count
    heading_count = len(soup.find_all(['h1', 'h2', 'h3', 'h4', 'h5', 'h6']))
    content_data["heading_count"] = heading_count
    
    # Image count and alt text
    images = soup.find_all('img')
    content_data["image_count"] = len(images)
    
    images_with_alt = [img for img in images if img.get('alt')]
    content_data["images_with_alt_count"] = len(images_with_alt)
    
    # Link counts
    all_links = soup.find_all('a', href=True)
    
    # Extract the domain from href for comparison
    domain = urlparse(soup.get('url', '')).netloc
    
    internal_links = [link for link in all_links if 
                     not link['href'].startswith(('http', 'https')) or 
                     domain in link['href']]
    
    external_links = [link for link in all_links if 
                     link['href'].startswith(('http', 'https')) and 
                     domain not in link['href']]
    
    content_data["internal_link_count"] = len(internal_links)
    content_data["external_link_count"] = len(external_links)
    
    return content_data

# Extract top keywords
def extract_keywords(soup, max_keywords=5):
    # Get all text
    text = soup.get_text()
    
    # Remove common words
    common_words = set([
        'the', 'be', 'to', 'of', 'and', 'a', 'in', 'that', 'have', 'i',
        'it', 'for', 'not', 'on', 'with', 'he', 'as', 'you', 'do', 'at',
        'this', 'but', 'his', 'by', 'from', 'they', 'we', 'say', 'her',
        'she', 'or', 'an', 'will', 'my', 'one', 'all', 'would', 'there',
        'their', 'what', 'so', 'up', 'out', 'if', 'about', 'who', 'get',
        'which', 'go', 'me', 'when', 'make', 'can', 'like', 'time', 'no',
        'just', 'him', 'know', 'take', 'people', 'into', 'year', 'your',
        'good', 'some', 'could', 'them', 'see', 'other', 'than', 'then',
        'now', 'look', 'only', 'come', 'its', 'over', 'think', 'also',
        'back', 'after', 'use', 'two', 'how', 'our', 'work', 'first',
        'well', 'way', 'even', 'new', 'want', 'because', 'any', 'these',
        'give', 'day', 'most', 'us'
    ])
    
    # HVAC industry-specific words to prioritize
    hvac_words = [
        'hvac', 'heating', 'cooling', 'air', 'conditioning', 'furnace',
        'ac', 'heat', 'pump', 'thermostat', 'repair', 'service',
        'maintenance', 'install', 'installation', 'replacement',
        'emergency', 'commercial', 'residential', 'duct', 'ventilation',
        'indoor', 'air', 'quality', 'filter', 'efficiency', 'system',
        'unit', 'contractor', 'technician', 'energy', 'comfort'
    ]
    
    # Extract words
    words = re.findall(r'\b[a-zA-Z]{3,}\b', text.lower())
    
    # Filter out common words
    words = [word for word in words if word not in common_words]
    
    # Count word frequencies
    word_counts = {}
    for word in words:
        if word in word_counts:
            word_counts[word] += 1
        else:
            word_counts[word] = 1
    
    # Prioritize HVAC-related words
    for word in hvac_words:
        if word in word_counts:
            word_counts[word] *= 1.5  # Add 50% bonus to HVAC words
    
    # Get top words
    top_words = sorted(word_counts.items(), key=lambda x: x[1], reverse=True)
    return [word for word, count in top_words[:max_keywords]]

# Detect social media profiles
def detect_social_media(soup, html):
    social_data = {
        "has_facebook": False,
        "has_twitter": False,
        "has_instagram": False,
        "has_linkedin": False,
        "has_google_business": False
    }
    
    # Look for links to social profiles
    all_links = soup.find_all('a', href=True)
    
    for link in all_links:
        href = link['href'].lower()
        
        if 'facebook.com' in href:
            social_data["has_facebook"] = True
        elif 'twitter.com' in href or 'x.com' in href:
            social_data["has_twitter"] = True
        elif 'instagram.com' in href:
            social_data["has_instagram"] = True
        elif 'linkedin.com' in href:
            social_data["has_linkedin"] = True
        elif 'google.com/business' in href or 'business.google.com' in href:
            social_data["has_google_business"] = True
    
    # Also check for classes and IDs which might indicate social presence
    if not social_data["has_facebook"] and ('facebook' in html or 'fb-' in html):
        social_data["has_facebook"] = True
    
    if not social_data["has_twitter"] and ('twitter' in html or 'tweet' in html):
        social_data["has_twitter"] = True
    
    if not social_data["has_instagram"] and 'instagram' in html:
        social_data["has_instagram"] = True
    
    if not social_data["has_linkedin"] and 'linkedin' in html:
        social_data["has_linkedin"] = True
    
    return social_data

# Calculate SEO scores
def calculate_seo_scores(seo_data):
    scores = {}
    issues = []
    
    # Title score
    title_score = 0
    if seo_data.get("has_title_tag"):
        title_score += 50
        title_text = seo_data.get("title_text", "")
        
        if title_text:
            title_len = len(title_text)
            # Ideal title length 50-60 chars
            if 50 <= title_len <= 60:
                title_score += 50
            elif 40 <= title_len <= 70:
                title_score += 30
            else:
                title_score += 10
                if title_len < 10:
                    issues.append("Title tag is too short")
                elif title_len > 70:
                    issues.append("Title tag is too long")
    else:
        issues.append("Missing title tag")
    
    scores["title_score"] = title_score
    
    # Meta description score
    meta_score = 0
    if seo_data.get("has_meta_description"):
        meta_score += 50
        meta_text = seo_data.get("meta_description_text", "")
        
        if meta_text:
            meta_len = len(meta_text)
            # Ideal meta description length 120-155 chars
            if 120 <= meta_len <= 155:
                meta_score += 50
            elif 100 <= meta_len <= 170:
                meta_score += 30
            else:
                meta_score += 10
                if meta_len < 70:
                    issues.append("Meta description is too short")
                elif meta_len > 170:
                    issues.append("Meta description is too long")
    else:
        issues.append("Missing meta description")
    
    scores["meta_description_score"] = meta_score
    
    # Content score
    content_score = 0
    
    # Word count analysis (ideal: 500+ words)
    word_count = seo_data.get("word_count", 0)
    if word_count >= 1000:
        content_score += 40
    elif word_count >= 500:
        content_score += 30
    elif word_count >= 300:
        content_score += 20
    else:
        content_score += 10
        issues.append("Content is too thin (less than 300 words)")
    
    # Heading structure
    if seo_data.get("has_h1_tag"):
        content_score += 20
    else:
        issues.append("Missing H1 heading")
    
    heading_count = seo_data.get("heading_count", 0)
    if heading_count >= 3:
        content_score += 10
    
    # Image optimization
    image_count = seo_data.get("image_count", 0)
    images_with_alt = seo_data.get("images_with_alt_count", 0)
    
    if image_count > 0:
        alt_ratio = images_with_alt / image_count
        if alt_ratio >= 0.8:
            content_score += 20
        elif alt_ratio >= 0.5:
            content_score += 10
        else:
            issues.append("Many images missing alt text")
    
    # Link structure
    internal_links = seo_data.get("internal_link_count", 0)
    if internal_links >= 5:
        content_score += 10
    
    scores["content_score"] = min(100, content_score)
    
    # Overall SEO score
    overall_score = (
        scores["title_score"] * 0.3 +
        scores["meta_description_score"] * 0.2 +
        scores["content_score"] * 0.3
    )
    
    # Schema.org bonus
    if seo_data.get("has_schema_org"):
        overall_score += 10
    else:
        issues.append("No Schema.org markup detected")
    
    # Technical factors
    if seo_data.get("is_secure"):
        overall_score += 5
    else:
        issues.append("Website not using HTTPS")
    
    if seo_data.get("has_canonical_tag"):
        overall_score += 5
    else:
        issues.append("Missing canonical tag")
    
    scores["overall_seo_score"] = min(100, overall_score)
    scores["seo_issues"] = issues
    
    return scores

# Analyze a website's SEO
def analyze_website_seo(url):
    try:
        start_time = time.time()
        
        # Fetch the website
        headers = {
            "User-Agent": CONFIG["user_agent"]
        }
        response = requests.get(url, headers=headers, timeout=15)
        html = response.text
        
        # Calculate load time
        load_time = time.time() - start_time
        
        # Parse with BeautifulSoup
        soup = BeautifulSoup(html, 'html.parser')
        soup.url = url  # Add URL to the soup object for reference
        
        # Gather all SEO data
        seo_data = {}
        
        # Schema.org check
        schema_data = check_schema_org(soup, html)
        seo_data.update(schema_data)
        
        # Basic SEO elements
        basic_seo = analyze_seo_basics(soup, url)
        seo_data.update(basic_seo)
        
        # Content analysis
        content_data = analyze_content(soup)
        seo_data.update(content_data)
        
        # Top keywords
        seo_data["top_keywords"] = extract_keywords(soup)
        
        # Social media detection
        social_data = detect_social_media(soup, html)
        seo_data.update(social_data)
        
        # Load time
        seo_data["page_load_time_seconds"] = load_time
        
        # Calculate scores
        scores = calculate_seo_scores(seo_data)
        seo_data.update(scores)
        
        # Add raw HTML for debugging (optional)
        # seo_data["raw_html"] = html
        
        return seo_data
        
    except Exception as e:
        logger.error(f"Error analyzing SEO for {url}: {e}")
        return None

# Save SEO data to database
def save_seo_data(conn, company_id, site_url, seo_data):
    with conn.cursor() as cur:
        cur.execute("""
        INSERT INTO website_seo (
            company_id, site_url, has_schema_org, schema_org_types,
            has_title_tag, has_meta_description, has_h1_tag, has_canonical_tag,
            has_favicon, word_count, heading_count, image_count,
            images_with_alt_count, internal_link_count, external_link_count,
            title_score, meta_description_score, content_score, overall_seo_score,
            top_keywords, seo_issues, has_facebook, has_twitter, has_instagram,
            has_linkedin, has_google_business, page_load_time_seconds,
            is_secure, has_sitemap, has_robots_txt, title_text,
            meta_description_text, h1_text, raw_data
        ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
        ON CONFLICT (site_url) 
        DO UPDATE SET
            has_schema_org = EXCLUDED.has_schema_org,
            schema_org_types = EXCLUDED.schema_org_types,
            has_title_tag = EXCLUDED.has_title_tag, 
            has_meta_description = EXCLUDED.has_meta_description,
            has_h1_tag = EXCLUDED.has_h1_tag,
            has_canonical_tag = EXCLUDED.has_canonical_tag,
            has_favicon = EXCLUDED.has_favicon,
            word_count = EXCLUDED.word_count,
            heading_count = EXCLUDED.heading_count,
            image_count = EXCLUDED.image_count,
            images_with_alt_count = EXCLUDED.images_with_alt_count,
            internal_link_count = EXCLUDED.internal_link_count,
            external_link_count = EXCLUDED.external_link_count,
            title_score = EXCLUDED.title_score,
            meta_description_score = EXCLUDED.meta_description_score,
            content_score = EXCLUDED.content_score,
            overall_seo_score = EXCLUDED.overall_seo_score,
            top_keywords = EXCLUDED.top_keywords,
            seo_issues = EXCLUDED.seo_issues,
            has_facebook = EXCLUDED.has_facebook,
            has_twitter = EXCLUDED.has_twitter,
            has_instagram = EXCLUDED.has_instagram,
            has_linkedin = EXCLUDED.has_linkedin,
            has_google_business = EXCLUDED.has_google_business,
            page_load_time_seconds = EXCLUDED.page_load_time_seconds,
            is_secure = EXCLUDED.is_secure,
            has_sitemap = EXCLUDED.has_sitemap,
            has_robots_txt = EXCLUDED.has_robots_txt,
            title_text = EXCLUDED.title_text,
            meta_description_text = EXCLUDED.meta_description_text,
            h1_text = EXCLUDED.h1_text,
            raw_data = EXCLUDED.raw_data,
            last_checked = NOW()
        """, (
            company_id,
            site_url,
            seo_data.get("has_schema_org", False),
            seo_data.get("schema_org_types", []),
            seo_data.get("has_title_tag", False),
            seo_data.get("has_meta_description", False),
            seo_data.get("has_h1_tag", False),
            seo_data.get("has_canonical_tag", False),
            seo_data.get("has_favicon", False),
            seo_data.get("word_count", 0),
            seo_data.get("heading_count", 0),
            seo_data.get("image_count", 0),
            seo_data.get("images_with_alt_count", 0),
            seo_data.get("internal_link_count", 0),
            seo_data.get("external_link_count", 0),
            seo_data.get("title_score", 0),
            seo_data.get("meta_description_score", 0),
            seo_data.get("content_score", 0),
            seo_data.get("overall_seo_score", 0),
            seo_data.get("top_keywords", []),
            seo_data.get("seo_issues", []),
            seo_data.get("has_facebook", False),
            seo_data.get("has_twitter", False),
            seo_data.get("has_instagram", False),
            seo_data.get("has_linkedin", False),
            seo_data.get("has_google_business", False),
            seo_data.get("page_load_time_seconds", 0),
            seo_data.get("is_secure", False),
            seo_data.get("has_sitemap", False),
            seo_data.get("has_robots_txt", False),
            seo_data.get("title_text", None),
            seo_data.get("meta_description_text", None),
            seo_data.get("h1_text", None),
            json.dumps(seo_data)
        ))

# Main function
def main():
    logger.info("Starting SEO analysis...")
    conn = get_db_connection()
    create_seo_table(conn)
    
    # Get companies to analyze
    companies = get_companies_to_analyze(conn, limit=50)
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
            
            logger.info(f"Analyzing SEO for {normalized_url} ({company_name})...")
            
            try:
                # Analyze SEO
                seo_data = analyze_website_seo(normalized_url)
                if not seo_data:
                    logger.error(f"Failed to analyze SEO for {normalized_url}")
                    errors += 1
                    continue
                
                # Save to database
                save_seo_data(conn, company_id, normalized_url, seo_data)
                
                logger.info(f"Saved SEO analysis for {company_name}")
                logger.info(f"  SEO Score: {seo_data.get('overall_seo_score', 0)}/100")
                logger.info(f"  Schema.org: {seo_data.get('has_schema_org', False)}")
                logger.info(f"  Keywords: {', '.join(seo_data.get('top_keywords', []))}")
                logger.info(f"  Issues: {len(seo_data.get('seo_issues', []))} found")
                
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
            AVG(overall_seo_score) as avg_score,
            SUM(CASE WHEN has_schema_org THEN 1 ELSE 0 END) as with_schema,
            AVG(word_count) as avg_words
        FROM website_seo
        """)
        stats = cur.fetchone()
        
        logger.info(f"\nDatabase Stats:")
        logger.info(f"Total websites analyzed: {stats[0]}")
        logger.info(f"Average SEO score: {stats[1]:.1f}/100")
        logger.info(f"With Schema.org: {stats[2]} ({stats[2]/stats[0]*100:.1f}%)")
        logger.info(f"Average word count: {stats[3]:.0f} words")
    
    conn.close()
    logger.info("Done!")

if __name__ == "__main__":
    main()