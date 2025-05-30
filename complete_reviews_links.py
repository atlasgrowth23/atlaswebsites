#!/usr/bin/env python3
"""
Complete reviews_link generation for all remaining Alabama businesses.
"""

import os
import psycopg2

def complete_reviews_links():
    """Generate reviews_link for all Alabama businesses that don't have one"""
    
    conn = psycopg2.connect(os.environ.get('DATABASE_URL'))
    cursor = conn.cursor()
    
    try:
        # Get businesses without reviews_link
        cursor.execute("""
            SELECT id, name, place_id, city
            FROM companies 
            WHERE state = 'Alabama' 
            AND place_id IS NOT NULL 
            AND (reviews_link IS NULL OR reviews_link = '')
        """)
        
        businesses = cursor.fetchall()
        print(f"Found {len(businesses)} businesses without reviews_link")
        
        if not businesses:
            print("All businesses already have reviews_link!")
            return 0
        
        # Process in batches
        updated_count = 0
        batch_size = 50
        
        for i in range(0, len(businesses), batch_size):
            batch = businesses[i:i + batch_size]
            
            for company_id, name, place_id, city in batch:
                # Generate query parameter
                city_clean = city.replace(' ', '+') if city else ''
                query = f"hvac,+{city_clean},+AL,+US"
                
                # Generate reviews_link
                reviews_link = f"https://search.google.com/local/reviews?placeid={place_id}&q={query}&authuser=0&hl=en&gl=US"
                
                # Update database
                cursor.execute(
                    "UPDATE companies SET reviews_link = %s WHERE id = %s",
                    (reviews_link, company_id)
                )
                updated_count += 1
            
            # Commit this batch
            conn.commit()
            print(f"Processed batch {i//batch_size + 1}, total updated: {updated_count}")
        
        # Final verification
        cursor.execute("""
            SELECT COUNT(*) 
            FROM companies 
            WHERE state = 'Alabama' AND reviews_link IS NOT NULL AND reviews_link != ''
        """)
        
        total_with_links = cursor.fetchone()[0]
        print(f"\n✅ Successfully updated {updated_count} businesses")
        print(f"Total Alabama businesses with reviews_link: {total_with_links}")
        
        return updated_count
        
    except Exception as e:
        conn.rollback()
        print(f"Error: {str(e)}")
        return 0
    finally:
        cursor.close()
        conn.close()

if __name__ == "__main__":
    count = complete_reviews_links()
    print(f"\nResult: {count} reviews links generated")