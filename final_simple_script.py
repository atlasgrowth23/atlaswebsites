#!/usr/bin/env python3
"""
Final script to complete remaining tasks efficiently.
Run with: python final_simple_script.py
"""

import csv
import os
import psycopg2

def main():
    conn = psycopg2.connect(os.environ.get('DATABASE_URL'))
    cursor = conn.cursor()
    
    try:
        print("=== TASK 1: Complete Reviews Links ===")
        
        # Generate remaining reviews_link using SQL
        cursor.execute("""
            UPDATE companies 
            SET reviews_link = 'https://search.google.com/local/reviews?placeid=' || place_id || '&q=hvac,+' || COALESCE(REPLACE(city, ' ', '+'), '') || ',+AL,+US&authuser=0&hl=en&gl=US'
            WHERE state = 'Alabama' 
            AND place_id IS NOT NULL 
            AND (reviews_link IS NULL OR reviews_link = '')
        """)
        
        remaining_updated = cursor.rowcount
        print(f"Generated {remaining_updated} additional reviews links")
        
        # Get total count
        cursor.execute("""
            SELECT COUNT(*) 
            FROM companies 
            WHERE state = 'Alabama' AND reviews_link IS NOT NULL AND reviews_link != ''
        """)
        total_reviews = cursor.fetchone()[0]
        print(f"Total Alabama businesses with reviews_link: {total_reviews}")
        
        print("\n=== TASK 2: Add Logo Predictions ===")
        
        # Add predicted_label column
        cursor.execute("ALTER TABLE companies ADD COLUMN IF NOT EXISTS predicted_label TEXT;")
        print("Added predicted_label column")
        
        # Read logo predictions (use smaller batches)
        predictions = {}
        with open('logo_predictions_merged.csv', 'r', encoding='utf-8') as f:
            reader = csv.DictReader(f)
            for row in reader:
                place_id = row.get('place_id', '').strip()
                label = row.get('predicted_label', '').strip()
                if place_id and label:
                    predictions[place_id] = label
        
        print(f"Found {len(predictions)} logo predictions in CSV")
        
        # Update in small batches to avoid timeout
        updated_logos = 0
        batch_size = 100
        place_ids = list(predictions.keys())
        
        for i in range(0, len(place_ids), batch_size):
            batch = place_ids[i:i + batch_size]
            for place_id in batch:
                label = predictions[place_id]
                cursor.execute(
                    "UPDATE companies SET predicted_label = %s WHERE place_id = %s",
                    (label, place_id)
                )
                if cursor.rowcount > 0:
                    updated_logos += 1
            
            # Commit each batch
            conn.commit()
            print(f"Processed batch {i//batch_size + 1}, updated: {updated_logos}")
        
        print(f"Updated {updated_logos} businesses with logo predictions")
        
        # Final statistics
        cursor.execute("""
            SELECT 
                COUNT(*) as total,
                COUNT(CASE WHEN predicted_label = 'logo' THEN 1 END) as has_logo,
                COUNT(CASE WHEN predicted_label = 'not_logo' THEN 1 END) as not_logo
            FROM companies 
            WHERE state = 'Alabama'
        """)
        
        total, has_logo, not_logo = cursor.fetchone()
        
        print(f"\n=== FINAL RESULTS ===")
        print(f"Total Alabama businesses: {total}")
        print(f"Businesses with reviews_link: {total_reviews}")
        print(f"Businesses with 'logo' prediction: {has_logo}")
        print(f"Businesses with 'not_logo' prediction: {not_logo}")
        print(f"Logo predictions coverage: {updated_logos}/{total}")
        
    except Exception as e:
        conn.rollback()
        print(f"Error: {str(e)}")
    finally:
        cursor.close()
        conn.close()

if __name__ == "__main__":
    main()