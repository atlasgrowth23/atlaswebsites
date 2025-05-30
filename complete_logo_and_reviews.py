#!/usr/bin/env python3
"""
Complete all remaining tasks:
1. Finish logo predictions for ALL Alabama and Arkansas businesses
2. Add review timeline columns (r_30, r_60, r_90, r_365) to database
"""

import csv
import os
import psycopg2

def add_review_timeline_columns():
    """Add review timeline columns to companies table"""
    
    conn = psycopg2.connect(os.environ.get('DATABASE_URL'))
    cursor = conn.cursor()
    
    try:
        # Add review timeline columns
        cursor.execute("""
            ALTER TABLE companies 
            ADD COLUMN IF NOT EXISTS r_30 INTEGER,
            ADD COLUMN IF NOT EXISTS r_60 INTEGER,
            ADD COLUMN IF NOT EXISTS r_90 INTEGER,
            ADD COLUMN IF NOT EXISTS r_365 INTEGER;
        """)
        
        print("Added review timeline columns (r_30, r_60, r_90, r_365)")
        
        # Import data from enhanced CSV
        with open('CompanyData/enhanced_hvac_with_reviews_timeline.csv', 'r', encoding='utf-8') as f:
            reader = csv.DictReader(f)
            updated_count = 0
            
            for row in reader:
                company_id = row.get('id', '').strip()
                r_30 = row.get('r_30', '') or None
                r_60 = row.get('r_60', '') or None
                r_90 = row.get('r_90', '') or None
                r_365 = row.get('r_365', '') or None
                
                if company_id:
                    cursor.execute("""
                        UPDATE companies 
                        SET r_30 = %s, r_60 = %s, r_90 = %s, r_365 = %s 
                        WHERE id = %s
                    """, (r_30, r_60, r_90, r_365, company_id))
                    
                    if cursor.rowcount > 0:
                        updated_count += 1
        
        conn.commit()
        print(f"Updated {updated_count} businesses with review timeline data")
        
    except Exception as e:
        conn.rollback()
        print(f"Review timeline error: {str(e)}")
    finally:
        cursor.close()
        conn.close()

def complete_all_logo_predictions():
    """Complete logo predictions for both Alabama and Arkansas using business names"""
    
    conn = psycopg2.connect(os.environ.get('DATABASE_URL'))
    cursor = conn.cursor()
    
    try:
        # Read logo predictions by business name and place_id
        predictions_by_place_id = {}
        predictions_by_name = {}
        
        with open('logo_predictions_merged.csv', 'r', encoding='utf-8') as f:
            reader = csv.DictReader(f)
            for row in reader:
                place_id = row.get('place_id', '').strip()
                business_name = row.get('business_name', '').strip()
                label = row.get('predicted_label', '').strip()
                
                if place_id and label:
                    predictions_by_place_id[place_id] = label
                
                if business_name and label:
                    predictions_by_name[business_name.lower()] = label
        
        print(f"Found {len(predictions_by_place_id)} predictions by place_id")
        print(f"Found {len(predictions_by_name)} predictions by business name")
        
        # Get all businesses in Alabama and Arkansas
        cursor.execute("""
            SELECT id, name, place_id, state
            FROM companies 
            WHERE state IN ('Alabama', 'Arkansas')
        """)
        
        businesses = cursor.fetchall()
        print(f"Processing {len(businesses)} businesses in Alabama and Arkansas")
        
        updated_count = 0
        
        for company_id, name, place_id, state in businesses:
            predicted_label = None
            
            # Try place_id match first
            if place_id and place_id in predictions_by_place_id:
                predicted_label = predictions_by_place_id[place_id]
            
            # Try business name match
            elif name and name.lower() in predictions_by_name:
                predicted_label = predictions_by_name[name.lower()]
            
            # If no logo prediction found, default to showing business name
            else:
                predicted_label = 'not_logo'
            
            # Update the business
            cursor.execute(
                "UPDATE companies SET predicted_label = %s WHERE id = %s",
                (predicted_label, company_id)
            )
            
            if cursor.rowcount > 0:
                updated_count += 1
        
        conn.commit()
        print(f"Updated {updated_count} businesses with logo predictions")
        
        # Get final statistics
        cursor.execute("""
            SELECT 
                state,
                COUNT(*) as total,
                COUNT(CASE WHEN predicted_label = 'logo' THEN 1 END) as has_logo,
                COUNT(CASE WHEN predicted_label = 'not_logo' THEN 1 END) as show_name
            FROM companies 
            WHERE state IN ('Alabama', 'Arkansas')
            GROUP BY state
            ORDER BY state
        """)
        
        print("\nFinal logo prediction status:")
        for state, total, has_logo, show_name in cursor.fetchall():
            print(f"{state}: {total} businesses ({has_logo} show logo, {show_name} show name)")
        
    except Exception as e:
        conn.rollback()
        print(f"Logo prediction error: {str(e)}")
    finally:
        cursor.close()
        conn.close()

def main():
    print("=== COMPLETING ALL REMAINING TASKS ===")
    
    print("\n1. Adding review timeline columns...")
    add_review_timeline_columns()
    
    print("\n2. Completing logo predictions for all businesses...")
    complete_all_logo_predictions()
    
    print("\n=== TASKS COMPLETE ===")

if __name__ == "__main__":
    main()