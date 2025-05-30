#!/usr/bin/env python3
"""
Map Alabama HVAC CSV to database using multiple matching strategies.
"""

import csv
import os
import psycopg2
import re
from difflib import SequenceMatcher

def normalize_name(name):
    """Normalize business name for matching"""
    if not name:
        return ""
    
    name = name.lower()
    
    # Remove common business suffixes
    replacements = [
        r'\bllc\b', r'\binc\b', r'\bcorp\b', r'\bco\b', r'\bcompany\b',
        r'\bservices?\b', r'\bsolutions?\b', r'\bsystem\b', r'\bsystems\b',
        r'\bheating\b', r'\bcooling\b', r'\bair\b', r'\bconditioning\b',
        r'\bhvac\b', r'\bmechanical\b', r'\bcontractors?\b', r'\bcontractor\b',
        r'\bplumbing\b', r'\belectrical\b', r'\b&\b', r'\band\b', r'\bthe\b'
    ]
    
    for pattern in replacements:
        name = re.sub(pattern, ' ', name)
    
    # Clean punctuation and spaces
    name = re.sub(r'[^\w\s]', ' ', name)
    name = re.sub(r'\s+', ' ', name).strip()
    
    return name

def similarity(a, b):
    """Calculate similarity between two strings"""
    return SequenceMatcher(None, a, b).ratio()

def clean_phone(phone):
    """Extract digits from phone number"""
    return re.sub(r'[^\d]', '', phone or '')

def update_reviews_links():
    """Map Alabama HVAC CSV to database"""
    
    # Read Alabama HVAC CSV
    csv_file = "alabamahvac - Alabama Hvac - Sheet1.csv"
    csv_businesses = []
    
    with open(csv_file, 'r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        for row in reader:
            name = row.get('name', '').strip()
            reviews_link = row.get('reviews_link', '').strip()
            city = row.get('city', '').strip()
            phone = row.get('phone', '').strip()
            place_id = row.get('place_id', '').strip()
            
            if name and reviews_link:
                csv_businesses.append({
                    'name': name,
                    'normalized_name': normalize_name(name),
                    'city': city.lower() if city else '',
                    'phone': clean_phone(phone),
                    'reviews_link': reviews_link,
                    'place_id': place_id
                })
    
    print(f"Alabama HVAC CSV: {len(csv_businesses)} businesses with reviews_link")
    
    # Connect to database
    conn = psycopg2.connect(os.environ.get('DATABASE_URL'))
    cursor = conn.cursor()
    
    try:
        # Get Alabama businesses from database
        cursor.execute("""
            SELECT id, name, city, phone, place_id 
            FROM companies 
            WHERE state = 'Alabama' OR state = 'AL'
        """)
        db_businesses = cursor.fetchall()
        
        print(f"Database: {len(db_businesses)} Alabama businesses")
        
        matches = []
        
        # Strategy 1: Exact place_id match
        place_id_matches = 0
        for db_id, db_name, db_city, db_phone, db_place_id in db_businesses:
            if db_place_id:
                for csv_biz in csv_businesses:
                    if csv_biz['place_id'] == db_place_id:
                        matches.append({
                            'db_id': db_id,
                            'db_name': db_name,
                            'csv_name': csv_biz['name'],
                            'match_type': 'place_id',
                            'score': 1.0,
                            'reviews_link': csv_biz['reviews_link']
                        })
                        place_id_matches += 1
                        break
        
        print(f"Place ID matches: {place_id_matches}")
        
        # Strategy 2: Exact name match
        matched_db_ids = {m['db_id'] for m in matches}
        name_matches = 0
        
        for db_id, db_name, db_city, db_phone, db_place_id in db_businesses:
            if db_id in matched_db_ids:
                continue
                
            db_name_lower = db_name.lower() if db_name else ''
            for csv_biz in csv_businesses:
                if db_name_lower == csv_biz['name'].lower():
                    matches.append({
                        'db_id': db_id,
                        'db_name': db_name,
                        'csv_name': csv_biz['name'],
                        'match_type': 'exact_name',
                        'score': 1.0,
                        'reviews_link': csv_biz['reviews_link']
                    })
                    matched_db_ids.add(db_id)
                    name_matches += 1
                    break
        
        print(f"Exact name matches: {name_matches}")
        
        # Strategy 3: Fuzzy name + location match
        fuzzy_matches = 0
        for db_id, db_name, db_city, db_phone, db_place_id in db_businesses:
            if db_id in matched_db_ids:
                continue
                
            best_match = None
            best_score = 0
            
            db_name_norm = normalize_name(db_name)
            db_city_norm = (db_city or '').lower().strip()
            db_phone_clean = clean_phone(db_phone)
            
            for csv_biz in csv_businesses:
                # Name similarity
                name_score = similarity(db_name_norm, csv_biz['normalized_name'])
                
                # City bonus
                city_bonus = 0.2 if db_city_norm == csv_biz['city'] else 0
                
                # Phone bonus
                phone_bonus = 0.3 if (db_phone_clean and csv_biz['phone'] and 
                                    db_phone_clean[-10:] == csv_biz['phone'][-10:]) else 0
                
                total_score = name_score + city_bonus + phone_bonus
                
                if total_score > best_score and total_score > 0.7:  # High threshold
                    best_score = total_score
                    best_match = csv_biz
            
            if best_match:
                matches.append({
                    'db_id': db_id,
                    'db_name': db_name,
                    'csv_name': best_match['name'],
                    'match_type': 'fuzzy',
                    'score': best_score,
                    'reviews_link': best_match['reviews_link']
                })
                matched_db_ids.add(db_id)
                fuzzy_matches += 1
        
        print(f"Fuzzy matches: {fuzzy_matches}")
        print(f"Total matches: {len(matches)}")
        
        # Update database
        updated_count = 0
        for match in matches:
            cursor.execute(
                "UPDATE companies SET reviews_link = %s WHERE id = %s",
                (match['reviews_link'], match['db_id'])
            )
            updated_count += 1
            
            if updated_count <= 10:  # Show first 10
                print(f"✓ {match['match_type']}: {match['db_name']}")
        
        conn.commit()
        
        print(f"\n✅ Successfully updated {updated_count} businesses with reviews_link")
        return updated_count
        
    except Exception as e:
        conn.rollback()
        print(f"❌ ERROR: {str(e)}")
        raise
    finally:
        cursor.close()
        conn.close()

if __name__ == "__main__":
    try:
        updated_count = update_reviews_links()
        print(f"\nFinal result: {updated_count} Alabama businesses now have reviews_link")
    except Exception as e:
        print(f"Script failed: {str(e)}")