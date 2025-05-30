#!/usr/bin/env python3
"""
Compare enhanced_hvac_with_reviews_timeline.csv with Alabama HVAC CSV to find matches.
"""

import csv
import os
import psycopg2
from difflib import SequenceMatcher

def normalize_name(name):
    """Normalize business name for matching"""
    if not name:
        return ""
    
    name = name.lower().strip()
    # Remove common words but keep core business identity
    replacements = [
        (r'\bllc\b', ''), (r'\binc\b', ''), (r'\bcorp\b', ''), 
        (r'\b&\b', 'and'), (r'\bco\b', 'company')
    ]
    
    for old, new in replacements:
        name = name.replace(old, new)
    
    # Clean extra spaces
    name = ' '.join(name.split())
    return name

def similarity(a, b):
    """Calculate similarity between two strings"""
    return SequenceMatcher(None, a, b).ratio()

def find_matches():
    """Find matches between enhanced CSV and Alabama HVAC CSV"""
    
    # Read enhanced CSV (Alabama businesses only)
    enhanced_file = "CompanyData/enhanced_hvac_with_reviews_timeline.csv"
    enhanced_businesses = {}
    
    with open(enhanced_file, 'r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        for row in reader:
            if row.get('state', '').strip() == 'Alabama':
                name = row.get('name', '').strip()
                place_id = row.get('place_id', '').strip()
                if name:
                    enhanced_businesses[row.get('id')] = {
                        'name': name,
                        'normalized_name': normalize_name(name),
                        'place_id': place_id,
                        'city': row.get('city', '').strip()
                    }
    
    print(f"Enhanced CSV: {len(enhanced_businesses)} Alabama businesses")
    
    # Read Alabama HVAC CSV
    alabama_hvac_file = "alabamahvac - Alabama Hvac - Sheet1.csv"
    hvac_businesses = []
    
    with open(alabama_hvac_file, 'r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        for row in reader:
            name = row.get('name', '').strip()
            reviews_link = row.get('reviews_link', '').strip()
            place_id = row.get('place_id', '').strip()
            
            if name and reviews_link:
                hvac_businesses.append({
                    'name': name,
                    'normalized_name': normalize_name(name),
                    'reviews_link': reviews_link,
                    'place_id': place_id,
                    'city': row.get('city', '').strip()
                })
    
    print(f"Alabama HVAC CSV: {len(hvac_businesses)} businesses with reviews_link")
    
    # Find matches
    matches = []
    
    # Strategy 1: Place ID matches
    place_id_matches = 0
    for company_id, enhanced in enhanced_businesses.items():
        if enhanced['place_id']:
            for hvac in hvac_businesses:
                if hvac['place_id'] == enhanced['place_id']:
                    matches.append({
                        'company_id': company_id,
                        'enhanced_name': enhanced['name'],
                        'hvac_name': hvac['name'],
                        'match_type': 'place_id',
                        'score': 1.0,
                        'reviews_link': hvac['reviews_link']
                    })
                    place_id_matches += 1
                    break
    
    print(f"Place ID matches: {place_id_matches}")
    
    # Strategy 2: Exact name matches
    matched_companies = {m['company_id'] for m in matches}
    exact_name_matches = 0
    
    for company_id, enhanced in enhanced_businesses.items():
        if company_id in matched_companies:
            continue
            
        for hvac in hvac_businesses:
            if enhanced['name'].lower() == hvac['name'].lower():
                matches.append({
                    'company_id': company_id,
                    'enhanced_name': enhanced['name'],
                    'hvac_name': hvac['name'],
                    'match_type': 'exact_name',
                    'score': 1.0,
                    'reviews_link': hvac['reviews_link']
                })
                matched_companies.add(company_id)
                exact_name_matches += 1
                break
    
    print(f"Exact name matches: {exact_name_matches}")
    
    # Strategy 3: High similarity name matches
    fuzzy_matches = 0
    for company_id, enhanced in enhanced_businesses.items():
        if company_id in matched_companies:
            continue
            
        best_match = None
        best_score = 0
        
        for hvac in hvac_businesses:
            # Check normalized name similarity
            name_score = similarity(enhanced['normalized_name'], hvac['normalized_name'])
            
            # Bonus for same city
            city_bonus = 0.1 if enhanced['city'].lower() == hvac['city'].lower() else 0
            
            total_score = name_score + city_bonus
            
            if total_score > best_score and total_score > 0.85:  # High threshold
                best_score = total_score
                best_match = hvac
        
        if best_match:
            matches.append({
                'company_id': company_id,
                'enhanced_name': enhanced['name'],
                'hvac_name': best_match['name'],
                'match_type': 'fuzzy',
                'score': best_score,
                'reviews_link': best_match['reviews_link']
            })
            matched_companies.add(company_id)
            fuzzy_matches += 1
    
    print(f"Fuzzy matches: {fuzzy_matches}")
    print(f"Total matches: {len(matches)}")
    
    # Show some examples
    print("\nSample matches:")
    for i, match in enumerate(matches[:10]):
        print(f"  {match['match_type']}: {match['enhanced_name']} <-> {match['hvac_name']}")
    
    # Update database
    if matches:
        conn = psycopg2.connect(os.environ.get('DATABASE_URL'))
        cursor = conn.cursor()
        
        try:
            updated_count = 0
            for match in matches:
                cursor.execute(
                    "UPDATE companies SET reviews_link = %s WHERE id = %s",
                    (match['reviews_link'], match['company_id'])
                )
                updated_count += 1
            
            conn.commit()
            print(f"\n✅ Updated {updated_count} companies with reviews_link")
            
        except Exception as e:
            conn.rollback()
            print(f"❌ Database update error: {str(e)}")
        finally:
            cursor.close()
            conn.close()
    
    return len(matches)

if __name__ == "__main__":
    try:
        total_matches = find_matches()
        print(f"\nResult: {total_matches} Alabama businesses matched and updated")
    except Exception as e:
        print(f"Script failed: {str(e)}")