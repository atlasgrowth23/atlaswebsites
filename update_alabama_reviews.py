#!/usr/bin/env python3
"""
Simple script to update Alabama businesses with reviews_link from Alabama HVAC CSV.
Run with: python update_alabama_reviews.py
"""

import csv
import os
import psycopg2
from difflib import SequenceMatcher

def clean_name(name):
    """Clean business name for better matching"""
    if not name:
        return ""
    
    # Convert to lowercase and remove common variations
    name = name.lower().strip()
    
    # Replace common variations
    replacements = [
        ('&', 'and'),
        (' llc', ''),
        (' inc', ''),
        (' corp', ''),
        (' co.', ''),
        (' co', ''),
        (' heating and air', ' heating air'),
        (' heating & air', ' heating air'),
        (' heating and cooling', ' heating cooling'),
        (' heating & cooling', ' heating cooling'),
    ]
    
    for old, new in replacements:
        name = name.replace(old, new)
    
    # Remove extra spaces
    return ' '.join(name.split())

def similarity_score(a, b):
    """Calculate similarity between two business names"""
    return SequenceMatcher(None, a, b).ratio()

def main():
    print("Starting Alabama reviews_link update...")
    
    # Read Alabama HVAC CSV
    hvac_data = {}
    hvac_by_place_id = {}
    
    print("Reading Alabama HVAC CSV...")
    with open('alabamahvac - Alabama Hvac - Sheet1.csv', 'r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        for row in reader:
            name = row.get('name', '').strip()
            reviews_link = row.get('reviews_link', '').strip()
            place_id = row.get('place_id', '').strip()
            
            if name and reviews_link and reviews_link.startswith('https://'):
                # Store by cleaned name
                cleaned_name = clean_name(name)
                hvac_data[cleaned_name] = {
                    'original_name': name,
                    'reviews_link': reviews_link,
                    'place_id': place_id
                }
                
                # Store by place_id for exact matching
                if place_id:
                    hvac_by_place_id[place_id] = {
                        'name': name,
                        'reviews_link': reviews_link
                    }
    
    print(f"Found {len(hvac_data)} businesses with reviews_link in CSV")
    
    # Connect to database
    print("Connecting to database...")
    conn = psycopg2.connect(os.environ.get('DATABASE_URL'))
    cursor = conn.cursor()
    
    try:
        # Get Alabama businesses from database
        cursor.execute("""
            SELECT id, name, place_id 
            FROM companies 
            WHERE state = 'Alabama'
            ORDER BY name
        """)
        
        db_businesses = cursor.fetchall()
        print(f"Found {len(db_businesses)} Alabama businesses in database")
        
        matches = []
        
        # Find matches
        print("Finding matches...")
        for company_id, db_name, db_place_id in db_businesses:
            matched = False
            match_type = ""
            reviews_link = ""
            hvac_name = ""
            
            # Strategy 1: Exact place_id match
            if db_place_id and db_place_id in hvac_by_place_id:
                hvac_match = hvac_by_place_id[db_place_id]
                reviews_link = hvac_match['reviews_link']
                hvac_name = hvac_match['name']
                match_type = "place_id"
                matched = True
            
            # Strategy 2: Exact cleaned name match
            elif db_name:
                cleaned_db_name = clean_name(db_name)
                if cleaned_db_name in hvac_data:
                    hvac_match = hvac_data[cleaned_db_name]
                    reviews_link = hvac_match['reviews_link']
                    hvac_name = hvac_match['original_name']
                    match_type = "exact_name"
                    matched = True
                
                # Strategy 3: High similarity match
                else:
                    best_score = 0
                    best_match = None
                    
                    for hvac_cleaned, hvac_info in hvac_data.items():
                        score = similarity_score(cleaned_db_name, hvac_cleaned)
                        if score > best_score:
                            best_score = score
                            best_match = hvac_info
                    
                    # Only accept very high similarity matches
                    if best_score > 0.85:
                        reviews_link = best_match['reviews_link']
                        hvac_name = best_match['original_name']
                        match_type = f"similarity_{best_score:.2f}"
                        matched = True
            
            if matched:
                matches.append({
                    'company_id': company_id,
                    'db_name': db_name,
                    'hvac_name': hvac_name,
                    'reviews_link': reviews_link,
                    'match_type': match_type
                })
        
        print(f"Found {len(matches)} total matches")
        
        # Show match breakdown
        place_id_count = len([m for m in matches if m['match_type'] == 'place_id'])
        exact_name_count = len([m for m in matches if m['match_type'] == 'exact_name'])
        similarity_count = len([m for m in matches if m['match_type'].startswith('similarity')])
        
        print(f"  Place ID matches: {place_id_count}")
        print(f"  Exact name matches: {exact_name_count}")
        print(f"  Similarity matches: {similarity_count}")
        
        # Update database
        if matches:
            print("Updating database...")
            updated_count = 0
            
            for match in matches:
                cursor.execute(
                    "UPDATE companies SET reviews_link = %s WHERE id = %s",
                    (match['reviews_link'], match['company_id'])
                )
                updated_count += 1
                
                # Show first 10 updates
                if updated_count <= 10:
                    print(f"  ✓ {match['match_type']}: {match['db_name']} -> {match['hvac_name']}")
            
            if len(matches) > 10:
                print(f"  ... and {len(matches) - 10} more")
            
            conn.commit()
            print(f"Successfully updated {updated_count} businesses")
        
        # Final verification
        cursor.execute("""
            SELECT COUNT(*) 
            FROM companies 
            WHERE state = 'Alabama' AND reviews_link IS NOT NULL AND reviews_link != ''
        """)
        final_count = cursor.fetchone()[0]
        
        print(f"\nFinal result: {final_count} Alabama businesses now have reviews_link")
        
    except Exception as e:
        conn.rollback()
        print(f"Error: {str(e)}")
    finally:
        cursor.close()
        conn.close()

if __name__ == "__main__":
    main()