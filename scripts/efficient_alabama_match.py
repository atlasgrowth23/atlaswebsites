#!/usr/bin/env python3
"""
Efficiently match Alabama businesses using exact and high-confidence matches only.
"""

import csv
import os
import psycopg2

def update_reviews_links():
    """Update database with Alabama HVAC reviews links"""
    
    # Read Alabama HVAC CSV into lookup dictionary
    hvac_file = "alabamahvac - Alabama Hvac - Sheet1.csv"
    hvac_lookup = {}
    hvac_by_place_id = {}
    
    with open(hvac_file, 'r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        for row in reader:
            name = row.get('name', '').strip()
            reviews_link = row.get('reviews_link', '').strip()
            place_id = row.get('place_id', '').strip()
            
            if name and reviews_link:
                # Exact name lookup
                hvac_lookup[name.lower()] = reviews_link
                
                # Place ID lookup
                if place_id:
                    hvac_by_place_id[place_id] = reviews_link
    
    print(f"Alabama HVAC: {len(hvac_lookup)} businesses with reviews_link")
    print(f"Alabama HVAC: {len(hvac_by_place_id)} with place_id")
    
    # Connect to database
    conn = psycopg2.connect(os.environ.get('DATABASE_URL'))
    cursor = conn.cursor()
    
    try:
        # Get Alabama businesses from database
        cursor.execute("""
            SELECT id, name, place_id 
            FROM companies 
            WHERE state = 'Alabama'
        """)
        db_businesses = cursor.fetchall()
        
        print(f"Database: {len(db_businesses)} Alabama businesses")
        
        updated_count = 0
        place_id_matches = 0
        name_matches = 0
        
        for company_id, company_name, db_place_id in db_businesses:
            reviews_link = None
            match_type = None
            
            # Strategy 1: Place ID match (most reliable)
            if db_place_id and db_place_id in hvac_by_place_id:
                reviews_link = hvac_by_place_id[db_place_id]
                match_type = "place_id"
                place_id_matches += 1
            
            # Strategy 2: Exact name match
            elif company_name and company_name.lower() in hvac_lookup:
                reviews_link = hvac_lookup[company_name.lower()]
                match_type = "exact_name"
                name_matches += 1
            
            # Update if we found a match
            if reviews_link:
                cursor.execute(
                    "UPDATE companies SET reviews_link = %s WHERE id = %s",
                    (reviews_link, company_id)
                )
                updated_count += 1
                
                if updated_count <= 20:  # Show first 20
                    print(f"✓ {match_type}: {company_name}")
        
        # Commit all updates
        conn.commit()
        
        print(f"\nMatch Summary:")
        print(f"Place ID matches: {place_id_matches}")
        print(f"Exact name matches: {name_matches}")
        print(f"Total updated: {updated_count}")
        
        return updated_count
        
    except Exception as e:
        conn.rollback()
        print(f"Database error: {str(e)}")
        raise
    finally:
        cursor.close()
        conn.close()

if __name__ == "__main__":
    try:
        count = update_reviews_links()
        print(f"\nFinal: {count} Alabama businesses now have reviews_link from Alabama HVAC CSV")
    except Exception as e:
        print(f"Script failed: {str(e)}")