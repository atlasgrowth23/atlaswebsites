#!/usr/bin/env python3
"""
Complete all remaining updates:
1. Finish logo predictions for Alabama businesses
2. Generate reviews_link for all Arkansas businesses
"""

import csv
import os
import psycopg2

def complete_logo_predictions():
    """Finish updating logo predictions for Alabama"""
    
    conn = psycopg2.connect(os.environ.get('DATABASE_URL'))
    cursor = conn.cursor()
    
    try:
        # Read all logo predictions
        predictions = {}
        with open('logo_predictions_merged.csv', 'r', encoding='utf-8') as f:
            reader = csv.DictReader(f)
            for row in reader:
                place_id = row.get('place_id', '').strip()
                label = row.get('predicted_label', '').strip()
                if place_id and label:
                    predictions[place_id] = label
        
        print(f"Found {len(predictions)} total logo predictions")
        
        # Update businesses that don't have predictions yet
        updated_count = 0
        for place_id, label in predictions.items():
            cursor.execute(
                "UPDATE companies SET predicted_label = %s WHERE place_id = %s AND predicted_label IS NULL",
                (label, place_id)
            )
            if cursor.rowcount > 0:
                updated_count += 1
        
        conn.commit()
        print(f"Updated {updated_count} additional businesses with logo predictions")
        
        # Get final Alabama logo statistics
        cursor.execute("""
            SELECT 
                COUNT(CASE WHEN predicted_label = 'logo' THEN 1 END) as has_logo,
                COUNT(CASE WHEN predicted_label = 'not_logo' THEN 1 END) as not_logo,
                COUNT(CASE WHEN predicted_label IS NOT NULL THEN 1 END) as total_predictions
            FROM companies 
            WHERE state = 'Alabama'
        """)
        
        has_logo, not_logo, total_predictions = cursor.fetchone()
        print(f"Alabama logo predictions complete: {has_logo} logos, {not_logo} not logos, {total_predictions} total")
        
    except Exception as e:
        conn.rollback()
        print(f"Logo prediction error: {str(e)}")
    finally:
        cursor.close()
        conn.close()

def generate_arkansas_reviews():
    """Generate reviews_link for all Arkansas businesses"""
    
    conn = psycopg2.connect(os.environ.get('DATABASE_URL'))
    cursor = conn.cursor()
    
    try:
        # Get Arkansas businesses without reviews_link
        cursor.execute("""
            SELECT COUNT(*) 
            FROM companies 
            WHERE state = 'Arkansas' AND place_id IS NOT NULL
        """)
        total_arkansas = cursor.fetchone()[0]
        
        cursor.execute("""
            SELECT COUNT(*) 
            FROM companies 
            WHERE state = 'Arkansas' 
            AND place_id IS NOT NULL 
            AND (reviews_link IS NULL OR reviews_link = '')
        """)
        without_reviews = cursor.fetchone()[0]
        
        print(f"Arkansas businesses: {total_arkansas} total, {without_reviews} need reviews_link")
        
        if without_reviews > 0:
            # Generate reviews_link for Arkansas businesses
            cursor.execute("""
                UPDATE companies 
                SET reviews_link = 'https://search.google.com/local/reviews?placeid=' || place_id || '&q=hvac,+' || COALESCE(REPLACE(city, ' ', '+'), '') || ',+AR,+US&authuser=0&hl=en&gl=US'
                WHERE state = 'Arkansas' 
                AND place_id IS NOT NULL 
                AND (reviews_link IS NULL OR reviews_link = '')
            """)
            
            arkansas_updated = cursor.rowcount
            print(f"Generated {arkansas_updated} reviews links for Arkansas businesses")
        
        conn.commit()
        
        # Final Arkansas statistics
        cursor.execute("""
            SELECT COUNT(*) 
            FROM companies 
            WHERE state = 'Arkansas' AND reviews_link IS NOT NULL AND reviews_link != ''
        """)
        
        arkansas_with_reviews = cursor.fetchone()[0]
        print(f"Arkansas businesses with reviews_link: {arkansas_with_reviews}")
        
    except Exception as e:
        conn.rollback()
        print(f"Arkansas reviews error: {str(e)}")
    finally:
        cursor.close()
        conn.close()

def main():
    print("=== COMPLETING ALL UPDATES ===")
    
    print("\n1. Finishing Alabama logo predictions...")
    complete_logo_predictions()
    
    print("\n2. Generating Arkansas reviews links...")
    generate_arkansas_reviews()
    
    # Final summary
    conn = psycopg2.connect(os.environ.get('DATABASE_URL'))
    cursor = conn.cursor()
    
    try:
        cursor.execute("""
            SELECT 
                state,
                COUNT(*) as total,
                COUNT(CASE WHEN reviews_link IS NOT NULL AND reviews_link != '' THEN 1 END) as with_reviews,
                COUNT(CASE WHEN predicted_label = 'logo' THEN 1 END) as has_logo,
                COUNT(CASE WHEN predicted_label = 'not_logo' THEN 1 END) as not_logo
            FROM companies 
            WHERE state IN ('Alabama', 'Arkansas')
            GROUP BY state
            ORDER BY state
        """)
        
        print(f"\n=== FINAL SUMMARY ===")
        for state, total, with_reviews, has_logo, not_logo in cursor.fetchall():
            print(f"{state}:")
            print(f"  Total businesses: {total}")
            print(f"  With reviews_link: {with_reviews}")
            print(f"  Predicted as logo: {has_logo}")
            print(f"  Predicted as not_logo: {not_logo}")
    
    except Exception as e:
        print(f"Summary error: {str(e)}")
    finally:
        cursor.close()
        conn.close()

if __name__ == "__main__":
    main()