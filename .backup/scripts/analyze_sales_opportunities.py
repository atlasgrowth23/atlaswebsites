#!/usr/bin/env python3
import os
import json
import psycopg2
import psycopg2.extras
import logging
from dotenv import load_dotenv
from datetime import datetime

# Load environment variables
load_dotenv('.env.local')

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler("sales_opportunities.log"),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger(__name__)

# Connect to the database
def get_db_connection():
    conn = psycopg2.connect(os.getenv("DATABASE_URL"))
    conn.autocommit = True
    return conn

# Create the sales opportunities table if it doesn't exist
def create_opportunities_table(conn):
    with conn.cursor() as cur:
        cur.execute("""
        CREATE TABLE IF NOT EXISTS sales_opportunities (
            id SERIAL PRIMARY KEY,
            company_id TEXT,
            company_name TEXT,
            state TEXT,
            city TEXT,
            phone TEXT,
            email TEXT,
            site_url TEXT,
            
            -- Review metrics
            total_reviews INTEGER,
            avg_rating DECIMAL(3,2),
            last_review_date TIMESTAMP WITH TIME ZONE,
            
            -- Website assessment
            has_website BOOLEAN DEFAULT FALSE,
            website_score INTEGER,
            mobile_friendly_score INTEGER,
            seo_score INTEGER,
            has_schema_org BOOLEAN DEFAULT FALSE,
            
            -- Opportunity classification
            opportunity_score INTEGER, -- 0-100 score
            opportunity_level TEXT, -- "High", "Medium", "Low"
            priority INTEGER, -- 1-5 (1 = highest priority)
            
            -- Business problems detected
            problems TEXT[],
            
            -- Outreach status
            outreach_status TEXT DEFAULT 'New', -- New, Contacted, In Discussion, Proposal Sent, Won, Lost
            last_contact_date TIMESTAMP WITH TIME ZONE,
            notes TEXT,
            
            -- Last update
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
        
        -- Add indexes for faster filtering/sorting
        CREATE INDEX IF NOT EXISTS idx_opportunities_company_id ON sales_opportunities(company_id);
        CREATE INDEX IF NOT EXISTS idx_opportunities_state ON sales_opportunities(state);
        CREATE INDEX IF NOT EXISTS idx_opportunities_opportunity_score ON sales_opportunities(opportunity_score DESC);
        CREATE INDEX IF NOT EXISTS idx_opportunities_priority ON sales_opportunities(priority);
        CREATE INDEX IF NOT EXISTS idx_opportunities_outreach_status ON sales_opportunities(outreach_status);
        """)
        logger.info("Sales opportunities table created or already exists")

# Analyze all available data and identify sales opportunities
def analyze_sales_opportunities(conn):
    with conn.cursor(cursor_factory=psycopg2.extras.DictCursor) as cur:
        # Get company data with website performance and SEO metrics if available
        cur.execute("""
        WITH review_stats AS (
            SELECT
                company_id,
                total_reviews,
                average_rating,
                latest_review_date
            FROM company_review_stats
        ),
        web_perf AS (
            SELECT
                company_id,
                mobile_performance_score,
                desktop_performance_score
            FROM website_performance
        ),
        web_seo AS (
            SELECT
                company_id,
                overall_seo_score,
                has_schema_org
            FROM website_seo
        )
        SELECT
            c.id,
            c.name,
            c.state,
            c.city,
            c.phone,
            c.email_1 as email,
            c.site,
            rs.total_reviews,
            rs.average_rating,
            rs.latest_review_date,
            CASE WHEN c.site IS NOT NULL AND c.site != '' THEN TRUE ELSE FALSE END as has_website,
            wp.mobile_performance_score,
            ws.overall_seo_score,
            ws.has_schema_org
        FROM
            companies c
        LEFT JOIN review_stats rs ON c.id = rs.company_id
        LEFT JOIN web_perf wp ON c.id = wp.company_id
        LEFT JOIN web_seo ws ON c.id = ws.company_id
        ORDER BY c.name
        """)
        
        companies = cur.fetchall()
        logger.info(f"Analyzing {len(companies)} companies for sales opportunities")
        
        opportunities = []
        
        for company in companies:
            # Convert to a dictionary for easier working
            company_dict = dict(company)
            
            # Identify problems and calculate opportunity score
            problems = []
            opportunity_score = 0
            
            # 1. Reviews assessment
            if not company_dict['total_reviews'] or company_dict['total_reviews'] < 10:
                problems.append("Few or no online reviews")
                opportunity_score += 20
            elif company_dict['average_rating'] and company_dict['average_rating'] < 4.0:
                problems.append(f"Low review rating ({company_dict['average_rating']})")
                opportunity_score += 15
            
            # 2. Website assessment
            if not company_dict['has_website']:
                problems.append("No website detected")
                opportunity_score += 25
            else:
                # Website performance
                if not company_dict['mobile_performance_score']:
                    problems.append("Website performance unknown")
                    opportunity_score += 10
                elif company_dict['mobile_performance_score'] < 50:
                    problems.append(f"Poor mobile performance ({company_dict['mobile_performance_score']})")
                    opportunity_score += 20
                elif company_dict['mobile_performance_score'] < 70:
                    problems.append(f"Average mobile performance ({company_dict['mobile_performance_score']})")
                    opportunity_score += 10
                
                # SEO assessment
                if not company_dict['overall_seo_score']:
                    problems.append("SEO metrics unknown")
                    opportunity_score += 10
                elif company_dict['overall_seo_score'] < 50:
                    problems.append(f"Poor SEO score ({company_dict['overall_seo_score']})")
                    opportunity_score += 20
                elif company_dict['overall_seo_score'] < 70:
                    problems.append(f"Average SEO score ({company_dict['overall_seo_score']})")
                    opportunity_score += 10
                
                # Schema.org assessment
                if not company_dict['has_schema_org']:
                    problems.append("No Schema.org markup")
                    opportunity_score += 15
            
            # Cap the score at 100
            opportunity_score = min(opportunity_score, 100)
            
            # Determine opportunity level and priority
            if opportunity_score >= 70:
                opportunity_level = "High"
                priority = 1
            elif opportunity_score >= 50:
                opportunity_level = "Medium"
                priority = 2
            elif opportunity_score >= 30:
                opportunity_level = "Low"
                priority = 3
            else:
                opportunity_level = "Very Low"
                priority = 4
            
            # Create opportunity record
            opportunity = {
                "company_id": company_dict['id'],
                "company_name": company_dict['name'],
                "state": company_dict['state'],
                "city": company_dict['city'],
                "phone": company_dict['phone'],
                "email": company_dict['email'],
                "site_url": company_dict['site'],
                "total_reviews": company_dict['total_reviews'] or 0,
                "avg_rating": float(company_dict['average_rating'] or 0),
                "last_review_date": company_dict['latest_review_date'],
                "has_website": company_dict['has_website'],
                "website_score": company_dict['mobile_performance_score'] or 0,
                "mobile_friendly_score": company_dict['mobile_performance_score'] or 0,
                "seo_score": company_dict['overall_seo_score'] or 0,
                "has_schema_org": company_dict['has_schema_org'] or False,
                "opportunity_score": opportunity_score,
                "opportunity_level": opportunity_level,
                "priority": priority,
                "problems": problems,
                "outreach_status": "New"
            }
            
            opportunities.append(opportunity)
        
        return opportunities

# Save opportunities to the database
def save_opportunities(conn, opportunities):
    with conn.cursor() as cur:
        for opp in opportunities:
            # Check if this company already has an opportunity record
            cur.execute("SELECT id FROM sales_opportunities WHERE company_id = %s", (opp['company_id'],))
            existing = cur.fetchone()
            
            if existing:
                # Update existing record
                cur.execute("""
                UPDATE sales_opportunities
                SET
                    company_name = %s,
                    state = %s,
                    city = %s,
                    phone = %s,
                    email = %s,
                    site_url = %s,
                    total_reviews = %s,
                    avg_rating = %s,
                    last_review_date = %s,
                    has_website = %s,
                    website_score = %s,
                    mobile_friendly_score = %s,
                    seo_score = %s,
                    has_schema_org = %s,
                    opportunity_score = %s,
                    opportunity_level = %s,
                    priority = %s,
                    problems = %s,
                    updated_at = NOW()
                WHERE company_id = %s
                """, (
                    opp['company_name'],
                    opp['state'],
                    opp['city'],
                    opp['phone'],
                    opp['email'],
                    opp['site_url'],
                    opp['total_reviews'],
                    opp['avg_rating'],
                    opp['last_review_date'],
                    opp['has_website'],
                    opp['website_score'],
                    opp['mobile_friendly_score'],
                    opp['seo_score'],
                    opp['has_schema_org'],
                    opp['opportunity_score'],
                    opp['opportunity_level'],
                    opp['priority'],
                    opp['problems'],
                    opp['company_id']
                ))
            else:
                # Insert new record
                cur.execute("""
                INSERT INTO sales_opportunities (
                    company_id, company_name, state, city, phone, email, site_url,
                    total_reviews, avg_rating, last_review_date, has_website,
                    website_score, mobile_friendly_score, seo_score, has_schema_org,
                    opportunity_score, opportunity_level, priority, problems, outreach_status
                ) VALUES (
                    %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s
                )
                """, (
                    opp['company_id'],
                    opp['company_name'],
                    opp['state'],
                    opp['city'],
                    opp['phone'],
                    opp['email'],
                    opp['site_url'],
                    opp['total_reviews'],
                    opp['avg_rating'],
                    opp['last_review_date'],
                    opp['has_website'],
                    opp['website_score'],
                    opp['mobile_friendly_score'],
                    opp['seo_score'],
                    opp['has_schema_org'],
                    opp['opportunity_score'],
                    opp['opportunity_level'],
                    opp['priority'],
                    opp['problems'],
                    opp['outreach_status']
                ))

# Generate sales report
def generate_sales_report(conn):
    with conn.cursor(cursor_factory=psycopg2.extras.DictCursor) as cur:
        # Get opportunity statistics
        cur.execute("""
        SELECT
            COUNT(*) as total,
            SUM(CASE WHEN opportunity_level = 'High' THEN 1 ELSE 0 END) as high_opportunity,
            SUM(CASE WHEN opportunity_level = 'Medium' THEN 1 ELSE 0 END) as medium_opportunity,
            SUM(CASE WHEN opportunity_level = 'Low' THEN 1 ELSE 0 END) as low_opportunity,
            SUM(CASE WHEN priority = 1 THEN 1 ELSE 0 END) as priority_1,
            AVG(opportunity_score) as avg_score
        FROM sales_opportunities
        """)
        stats = cur.fetchone()
        
        # Get top problems
        cur.execute("""
        SELECT
            unnest(problems) as problem,
            COUNT(*) as count
        FROM sales_opportunities
        GROUP BY problem
        ORDER BY count DESC
        LIMIT 10
        """)
        problems = cur.fetchall()
        
        # Get opportunities by state
        cur.execute("""
        SELECT
            state,
            COUNT(*) as total,
            SUM(CASE WHEN opportunity_level = 'High' THEN 1 ELSE 0 END) as high_opportunity,
            AVG(opportunity_score) as avg_score
        FROM sales_opportunities
        WHERE state IS NOT NULL AND state != ''
        GROUP BY state
        ORDER BY total DESC
        """)
        states = cur.fetchall()
        
        # Get top opportunities
        cur.execute("""
        SELECT
            id, company_name, state, opportunity_score, opportunity_level, 
            problems, has_website, website_score, seo_score
        FROM sales_opportunities
        WHERE opportunity_level = 'High'
        ORDER BY opportunity_score DESC
        LIMIT 25
        """)
        top_opportunities = cur.fetchall()
        
        # Format the report
        report = {
            "generated_at": datetime.now().isoformat(),
            "summary": {
                "total_opportunities": stats['total'],
                "high_priority": stats['high_opportunity'],
                "medium_priority": stats['medium_opportunity'],
                "low_priority": stats['low_opportunity'],
                "priority_1_count": stats['priority_1'],
                "average_opportunity_score": float(stats['avg_score']) if stats['avg_score'] else 0
            },
            "top_problems": [{"problem": p['problem'], "count": p['count']} for p in problems],
            "state_distribution": [
                {
                    "state": s['state'],
                    "total": s['total'],
                    "high_opportunity": s['high_opportunity'],
                    "avg_score": float(s['avg_score']) if s['avg_score'] else 0
                } for s in states
            ],
            "top_opportunities": [
                {
                    "id": o['id'],
                    "company_name": o['company_name'],
                    "state": o['state'],
                    "opportunity_score": o['opportunity_score'],
                    "opportunity_level": o['opportunity_level'],
                    "problems": o['problems'],
                    "has_website": o['has_website'],
                    "website_score": o['website_score'],
                    "seo_score": o['seo_score']
                } for o in top_opportunities
            ]
        }
        
        return report

# Generate CSV export of opportunities
def export_opportunities_csv(conn, filename="sales_opportunities.csv"):
    with conn.cursor(cursor_factory=psycopg2.extras.DictCursor) as cur:
        cur.execute("""
        SELECT
            id, company_name, state, city, phone, email, site_url,
            total_reviews, avg_rating, last_review_date,
            has_website, website_score, mobile_friendly_score, seo_score, has_schema_org,
            opportunity_score, opportunity_level, priority, 
            array_to_string(problems, '; ') as problems_list,
            outreach_status
        FROM sales_opportunities
        ORDER BY opportunity_score DESC
        """)
        
        opportunities = cur.fetchall()
        
        # Write CSV header
        with open(filename, 'w') as f:
            # Get column names from cursor description
            columns = [desc[0] for desc in cur.description]
            f.write(','.join(columns) + '\n')
            
            # Write data rows
            for opp in opportunities:
                row = []
                for col in columns:
                    value = opp[col]
                    if value is None:
                        row.append('')
                    elif isinstance(value, (datetime)):
                        row.append(value.isoformat())
                    else:
                        # Escape quotes and wrap in quotes if contains comma
                        value_str = str(value)
                        if ',' in value_str or '"' in value_str:
                            value_str = value_str.replace('"', '""')
                            value_str = f'"{value_str}"'
                        row.append(value_str)
                
                f.write(','.join(row) + '\n')
        
        return filename

# Main function
def main():
    logger.info("Starting sales opportunity analysis...")
    conn = get_db_connection()
    
    # Create the opportunities table if it doesn't exist
    create_opportunities_table(conn)
    
    # Analyze companies and identify opportunities
    opportunities = analyze_sales_opportunities(conn)
    logger.info(f"Identified {len(opportunities)} sales opportunities")
    
    # Save opportunities to database
    save_opportunities(conn, opportunities)
    logger.info("Saved opportunities to database")
    
    # Generate sales report
    report = generate_sales_report(conn)
    
    # Write report to file
    report_file = "sales_report.json"
    with open(report_file, 'w') as f:
        json.dump(report, f, indent=2)
    logger.info(f"Sales report saved to {report_file}")
    
    # Export CSV
    csv_file = "sales_opportunities.csv"
    export_opportunities_csv(conn, csv_file)
    logger.info(f"Opportunities exported to {csv_file}")
    
    # Print report summary
    logger.info("\n=== SALES OPPORTUNITY REPORT ===")
    logger.info(f"Total opportunities: {report['summary']['total_opportunities']}")
    logger.info(f"High priority: {report['summary']['high_priority']}")
    logger.info(f"Medium priority: {report['summary']['medium_priority']}")
    logger.info(f"Low priority: {report['summary']['low_priority']}")
    logger.info(f"Average opportunity score: {report['summary']['average_opportunity_score']:.1f}")
    
    logger.info("\nTop problems:")
    for problem in report['top_problems'][:5]:
        logger.info(f"- {problem['problem']}: {problem['count']} companies")
    
    logger.info("\nTop states by opportunity:")
    for state in sorted(report['state_distribution'], key=lambda x: x['high_opportunity'], reverse=True)[:5]:
        logger.info(f"- {state['state']}: {state['high_opportunity']} high-priority ({state['total']} total)")
    
    logger.info("\nTop 5 sales opportunities:")
    for opp in report['top_opportunities'][:5]:
        logger.info(f"- {opp['company_name']} ({opp['state']}): Score {opp['opportunity_score']}")
        logger.info(f"  Problems: {', '.join(opp['problems'])}")
    
    conn.close()
    logger.info("\nDone!")

if __name__ == "__main__":
    main()