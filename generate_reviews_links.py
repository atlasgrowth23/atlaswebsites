#!/usr/bin/env python3
"""
Generate reviews_link for all Alabama businesses using their place_id.
"""

import os
import psycopg2
import urllib.parse

def generate_reviews_links():
    """Generate reviews_link URLs for all Alabama businesses"""
    
    # Connect to database
    conn = psycopg2.connect(os.environ.get('DATABASE_URL'))
    cursor = conn.cursor()
    
    try:
        # Get Alabama businesses with place_id
        cursor.execute("""
            SELECT id, name, place_id, city, state
            FROM companies 
            WHERE state = 'Alabama' AND place_id IS NOT NULL
        """)
        
        businesses = cursor.fetchall()
        print(f"Found {len(businesses)} Alabama businesses with place_id")
        
        updated_count = 0
        
        for company_id, name, place_id, city, state in businesses:
            # Generate the query parameter (like "hvac, Birmingham, AL, US")
            city_clean = city.replace(' ', '+') if city else ''
            query = f"hvac,+{city_clean},+AL,+US"
            
            # Generate the reviews_link URL
            reviews_link = f"https://search.google.com/local/reviews?placeid={place_id}&q={query}&authuser=0&hl=en&gl=US"
            
            # Update the database
            cursor.execute(
                "UPDATE companies SET reviews_link = %s WHERE id = %s",
                (reviews_link, company_id)
            )
            
            updated_count += 1
            
            # Show first 10 examples
            if updated_count <= 10:
                print(f"✓ {name} ({city})")
                print(f"  {reviews_link}")
        
        # Commit all updates
        conn.commit()
        print(f"\n✅ Generated reviews_link for {updated_count} Alabama businesses")
        
        # Verify the update
        cursor.execute("""
            SELECT COUNT(*) 
            FROM companies 
            WHERE state = 'Alabama' AND reviews_link IS NOT NULL AND reviews_link != ''
        """)
        
        final_count = cursor.fetchone()[0]
        print(f"Total Alabama businesses now with reviews_link: {final_count}")
        
    except Exception as e:
        conn.rollback()
        print(f"Error: {str(e)}")
    finally:
        cursor.close()
        conn.close()

if __name__ == "__main__":
    generate_reviews_links()