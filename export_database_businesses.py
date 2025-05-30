#!/usr/bin/env python3
"""
Export database businesses to CSV matching the Alabama HVAC structure.
"""

import csv
import os
import psycopg2

def export_businesses():
    """Export businesses from database to CSV"""
    
    # Connect to database
    conn = psycopg2.connect(os.environ.get('DATABASE_URL'))
    cursor = conn.cursor()
    
    try:
        # Get all businesses with all relevant fields
        cursor.execute("""
            SELECT 
                id, name, slug, city, state, phone, rating, reviews, 
                place_id, location_reviews_link, reviews_link, latitude, longitude,
                site, email_1, verified, created_at, updated_at
            FROM companies 
            WHERE state = 'Alabama'
            ORDER BY city, name
        """)
        
        businesses = cursor.fetchall()
        
        print(f"Exporting {len(businesses)} Alabama businesses...")
        
        # Write to CSV
        with open('database_alabama_businesses.csv', 'w', newline='', encoding='utf-8') as f:
            writer = csv.writer(f)
            
            # Write header
            writer.writerow([
                'id', 'name', 'slug', 'city', 'state', 'phone', 'rating', 'reviews',
                'place_id', 'location_reviews_link', 'reviews_link', 'latitude', 'longitude',
                'site', 'email_1', 'verified', 'created_at', 'updated_at'
            ])
            
            # Write data
            for row in businesses:
                writer.writerow(row)
        
        print("✅ Exported to: database_alabama_businesses.csv")
        
        # Show some statistics
        cursor.execute("""
            SELECT 
                COUNT(*) as total,
                COUNT(CASE WHEN place_id IS NOT NULL THEN 1 END) as with_place_id,
                COUNT(CASE WHEN location_reviews_link IS NOT NULL THEN 1 END) as with_location_reviews,
                COUNT(CASE WHEN reviews_link IS NOT NULL THEN 1 END) as with_reviews_link
            FROM companies 
            WHERE state = 'Alabama'
        """)
        
        stats = cursor.fetchone()
        print(f"\nDatabase Statistics:")
        print(f"  Total Alabama businesses: {stats[0]}")
        print(f"  With place_id: {stats[1]}")
        print(f"  With location_reviews_link: {stats[2]}")
        print(f"  With reviews_link: {stats[3]}")
        
    except Exception as e:
        print(f"Error: {str(e)}")
    finally:
        cursor.close()
        conn.close()

if __name__ == "__main__":
    export_businesses()