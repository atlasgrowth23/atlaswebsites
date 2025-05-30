#!/usr/bin/env python3
"""
Final script to complete all data updates:
1. Logo predictions for Alabama and Arkansas using exact matching
2. Review timeline data import
Run with: python final_data_update.py
"""

import csv
import os
import psycopg2

def update_logo_predictions():
    """Update logo predictions using exact matching"""
    
    # Read logo predictions
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
                predictions_by_name[business_name] = label
    
    print(f"Loaded {len(predictions_by_place_id)} predictions by place_id")
    print(f"Loaded {len(predictions_by_name)} predictions by name")
    
    # Connect and update
    conn = psycopg2.connect(os.environ.get('DATABASE_URL'))
    cursor = conn.cursor()
    
    # Process in batches
    cursor.execute("SELECT id, name, place_id FROM companies WHERE state IN ('Alabama', 'Arkansas')")
    businesses = cursor.fetchall()
    
    print(f"Processing {len(businesses)} businesses...")
    
    updated = 0
    batch_size = 100
    
    for i in range(0, len(businesses), batch_size):
        batch = businesses[i:i + batch_size]
        
        for company_id, name, place_id in batch:
            label = None
            
            # Try exact place_id match
            if place_id in predictions_by_place_id:
                label = predictions_by_place_id[place_id]
            # Try exact name match
            elif name in predictions_by_name:
                label = predictions_by_name[name]
            # Default to not_logo (show business name)
            else:
                label = 'not_logo'
            
            cursor.execute("UPDATE companies SET predicted_label = %s WHERE id = %s", (label, company_id))
            if cursor.rowcount > 0:
                updated += 1
        
        conn.commit()
        print(f"Batch {i//batch_size + 1}: {updated} total updated")
    
    cursor.close()
    conn.close()
    return updated

def update_review_data():
    """Import review timeline data"""
    
    conn = psycopg2.connect(os.environ.get('DATABASE_URL'))
    cursor = conn.cursor()
    
    updated = 0
    batch_size = 100
    
    with open('CompanyData/enhanced_hvac_with_reviews_timeline.csv', 'r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        
        batch = []
        for row in reader:
            company_id = row.get('id', '').strip()
            r_30 = row.get('r_30', '') or None
            r_60 = row.get('r_60', '') or None
            r_90 = row.get('r_90', '') or None
            r_365 = row.get('r_365', '') or None
            
            if company_id:
                # Convert to integers
                try:
                    r_30 = int(r_30) if r_30 else None
                    r_60 = int(r_60) if r_60 else None
                    r_90 = int(r_90) if r_90 else None
                    r_365 = int(r_365) if r_365 else None
                except:
                    r_30 = r_60 = r_90 = r_365 = None
                
                batch.append((r_30, r_60, r_90, r_365, company_id))
                
                if len(batch) >= batch_size:
                    # Process batch
                    for r30, r60, r90, r365, cid in batch:
                        cursor.execute(
                            "UPDATE companies SET r_30 = %s, r_60 = %s, r_90 = %s, r_365 = %s WHERE id = %s",
                            (r30, r60, r90, r365, cid)
                        )
                        if cursor.rowcount > 0:
                            updated += 1
                    
                    conn.commit()
                    print(f"Review data: {updated} businesses updated")
                    batch = []
        
        # Process remaining batch
        if batch:
            for r30, r60, r90, r365, cid in batch:
                cursor.execute(
                    "UPDATE companies SET r_30 = %s, r_60 = %s, r_90 = %s, r_365 = %s WHERE id = %s",
                    (r30, r60, r90, r365, cid)
                )
                if cursor.rowcount > 0:
                    updated += 1
            conn.commit()
    
    cursor.close()
    conn.close()
    return updated

def main():
    print("=== FINAL DATA UPDATE ===")
    
    print("\n1. Updating logo predictions...")
    logo_count = update_logo_predictions()
    print(f"Logo predictions: {logo_count} businesses updated")
    
    print("\n2. Importing review timeline data...")
    review_count = update_review_data()
    print(f"Review data: {review_count} businesses updated")
    
    # Final status check
    conn = psycopg2.connect(os.environ.get('DATABASE_URL'))
    cursor = conn.cursor()
    
    cursor.execute("""
        SELECT 
            state,
            COUNT(*) as total,
            COUNT(CASE WHEN reviews_link IS NOT NULL THEN 1 END) as reviews,
            COUNT(CASE WHEN predicted_label = 'logo' THEN 1 END) as logos,
            COUNT(CASE WHEN predicted_label = 'not_logo' THEN 1 END) as names,
            COUNT(CASE WHEN r_365 IS NOT NULL THEN 1 END) as review_data
        FROM companies 
        WHERE state IN ('Alabama', 'Arkansas')
        GROUP BY state
        ORDER BY state
    """)
    
    print("\n=== FINAL STATUS ===")
    for state, total, reviews, logos, names, review_data in cursor.fetchall():
        print(f"{state}: {total} businesses")
        print(f"  Reviews links: {reviews}")
        print(f"  Show logos: {logos}")  
        print(f"  Show names: {names}")
        print(f"  Review data: {review_data}")
    
    cursor.close()
    conn.close()

if __name__ == "__main__":
    main()