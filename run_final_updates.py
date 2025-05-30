#!/usr/bin/env python3
"""
Simple script to complete both tasks:
1. Generate remaining reviews_link URLs
2. Add logo predictions column
"""

import csv
import os
import psycopg2

def main():
    conn = psycopg2.connect(os.environ.get('DATABASE_URL'))
    cursor = conn.cursor()
    
    print("Starting updates...")
    
    try:
        # TASK 1: Complete reviews_link generation
        print("\n1. Completing reviews_link generation...")
        cursor.execute("""
            UPDATE companies 
            SET reviews_link = 'https://search.google.com/local/reviews?placeid=' || place_id || '&q=hvac,+' || COALESCE(REPLACE(city, ' ', '+'), '') || ',+AL,+US&authuser=0&hl=en&gl=US'
            WHERE state = 'Alabama' 
            AND place_id IS NOT NULL 
            AND (reviews_link IS NULL OR reviews_link = '')
        """)
        
        reviews_updated = cursor.rowcount
        print(f"Generated {reviews_updated} new reviews links")
        
        # TASK 2: Add logo predictions column
        print("\n2. Adding logo predictions...")
        cursor.execute("ALTER TABLE companies ADD COLUMN IF NOT EXISTS predicted_label TEXT;")
        
        # Read predictions from CSV
        predictions = {}
        with open('logo_predictions_merged.csv', 'r', encoding='utf-8') as f:
            reader = csv.DictReader(f)
            for row in reader:
                place_id = row.get('place_id', '').strip()
                label = row.get('predicted_label', '').strip()
                if place_id and label:
                    predictions[place_id] = label
        
        print(f"Found {len(predictions)} logo predictions in CSV")
        
        # Update predictions
        logo_updated = 0
        for place_id, label in predictions.items():
            cursor.execute(
                "UPDATE companies SET predicted_label = %s WHERE place_id = %s",
                (label, place_id)
            )
            if cursor.rowcount > 0:
                logo_updated += 1
        
        print(f"Updated {logo_updated} businesses with logo predictions")
        
        # Commit all changes
        conn.commit()
        
        # Final statistics
        cursor.execute("""
            SELECT 
                COUNT(*) as total_alabama,
                COUNT(CASE WHEN reviews_link IS NOT NULL AND reviews_link != '' THEN 1 END) as with_reviews,
                COUNT(CASE WHEN predicted_label = 'logo' THEN 1 END) as has_logo,
                COUNT(CASE WHEN predicted_label = 'not_logo' THEN 1 END) as not_logo
            FROM companies 
            WHERE state = 'Alabama'
        """)
        
        total, with_reviews, has_logo, not_logo = cursor.fetchone()
        
        print(f"\nFinal Results:")
        print(f"Total Alabama businesses: {total}")
        print(f"With reviews_link: {with_reviews}")
        print(f"With 'logo' prediction: {has_logo}")
        print(f"With 'not_logo' prediction: {not_logo}")
        print(f"Success rate: {with_reviews}/{total} reviews links generated")
        
    except Exception as e:
        conn.rollback()
        print(f"Error: {str(e)}")
    finally:
        cursor.close()
        conn.close()

if __name__ == "__main__":
    main()