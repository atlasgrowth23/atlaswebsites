#!/usr/bin/env python3
"""
1. Complete reviews_link generation for remaining Alabama businesses
2. Add predicted_label column and update from logo predictions CSV
"""

import csv
import os
import psycopg2

def complete_reviews_links():
    """Complete reviews_link generation"""
    
    conn = psycopg2.connect(os.environ.get('DATABASE_URL'))
    cursor = conn.cursor()
    
    try:
        # Get businesses without reviews_link
        cursor.execute("""
            SELECT id, place_id, city
            FROM companies 
            WHERE state = 'Alabama' 
            AND place_id IS NOT NULL 
            AND (reviews_link IS NULL OR reviews_link = '')
        """)
        
        businesses = cursor.fetchall()
        print(f"Found {len(businesses)} businesses without reviews_link")
        
        if businesses:
            # Process in smaller batches to avoid timeout
            batch_size = 25
            updated_count = 0
            
            for i in range(0, len(businesses), batch_size):
                batch = businesses[i:i + batch_size]
                
                for company_id, place_id, city in batch:
                    city_clean = city.replace(' ', '+') if city else ''
                    query = f"hvac,+{city_clean},+AL,+US"
                    reviews_link = f"https://search.google.com/local/reviews?placeid={place_id}&q={query}&authuser=0&hl=en&gl=US"
                    
                    cursor.execute(
                        "UPDATE companies SET reviews_link = %s WHERE id = %s",
                        (reviews_link, company_id)
                    )
                    updated_count += 1
                
                conn.commit()
                print(f"Batch {i//batch_size + 1}: {updated_count} total updated")
        
        # Get final count
        cursor.execute("""
            SELECT COUNT(*) 
            FROM companies 
            WHERE state = 'Alabama' AND reviews_link IS NOT NULL AND reviews_link != ''
        """)
        
        total_with_links = cursor.fetchone()[0]
        print(f"Total Alabama businesses with reviews_link: {total_with_links}")
        
        return len(businesses)
        
    except Exception as e:
        conn.rollback()
        print(f"Reviews link error: {str(e)}")
        return 0
    finally:
        cursor.close()
        conn.close()

def add_logo_predictions():
    """Add predicted_label column and populate from CSV"""
    
    # Read logo predictions CSV
    predictions = {}
    
    with open('logo_predictions_merged.csv', 'r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        for row in reader:
            place_id = row.get('place_id', '').strip()
            predicted_label = row.get('predicted_label', '').strip()
            if place_id and predicted_label:
                predictions[place_id] = predicted_label
    
    print(f"Found {len(predictions)} logo predictions in CSV")
    
    # Update database
    conn = psycopg2.connect(os.environ.get('DATABASE_URL'))
    cursor = conn.cursor()
    
    try:
        # Add column if it doesn't exist
        cursor.execute("""
            ALTER TABLE companies 
            ADD COLUMN IF NOT EXISTS predicted_label TEXT;
        """)
        
        # Update predictions for matching place_ids
        updated_count = 0
        
        for place_id, predicted_label in predictions.items():
            cursor.execute(
                "UPDATE companies SET predicted_label = %s WHERE place_id = %s",
                (predicted_label, place_id)
            )
            
            if cursor.rowcount > 0:
                updated_count += 1
        
        conn.commit()
        
        # Get statistics
        cursor.execute("""
            SELECT 
                COUNT(*) as total,
                COUNT(CASE WHEN predicted_label = 'logo' THEN 1 END) as has_logo,
                COUNT(CASE WHEN predicted_label = 'not_logo' THEN 1 END) as not_logo
            FROM companies 
            WHERE state = 'Alabama'
        """)
        
        total, has_logo, not_logo = cursor.fetchone()
        
        print(f"Updated {updated_count} businesses with logo predictions")
        print(f"Alabama businesses with 'logo': {has_logo}")
        print(f"Alabama businesses with 'not_logo': {not_logo}")
        
        return updated_count
        
    except Exception as e:
        conn.rollback()
        print(f"Logo prediction error: {str(e)}")
        return 0
    finally:
        cursor.close()
        conn.close()

def main():
    print("=== Completing Reviews Links ===")
    reviews_updated = complete_reviews_links()
    
    print("\n=== Adding Logo Predictions ===")
    logo_updated = add_logo_predictions()
    
    print(f"\nFinal Results:")
    print(f"Reviews links generated: {reviews_updated}")
    print(f"Logo predictions added: {logo_updated}")

if __name__ == "__main__":
    main()