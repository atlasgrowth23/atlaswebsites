#!/usr/bin/env python3
"""
Clean database and export script:
1. Add modern_trust_preview column with atlasthrust.ai URLs
2. Remove invalid email1 entries where status is invalid
3. Split email1 into first_name and last_name
4. Delete unnecessary columns from database
5. Export clean CSVs with only needed fields
"""

import csv
import os
import psycopg2
import re

def parse_email_name(email1_value):
    """Parse email1 field to extract first and last name"""
    if not email1_value or email1_value.strip() == '':
        return None, None
    
    # Remove email part if present (everything after @)
    name_part = email1_value.split('@')[0]
    
    # Clean up common separators and numbers
    name_part = re.sub(r'[._\-0-9]+', ' ', name_part)
    name_part = name_part.strip()
    
    if not name_part:
        return None, None
    
    # Split into words and take first two as first/last name
    words = [word.capitalize() for word in name_part.split() if word]
    
    if len(words) >= 2:
        return words[0], words[1]
    elif len(words) == 1:
        return words[0], None
    else:
        return None, None

def main():
    print("=== CLEANING DATABASE AND EXPORTING ===")
    
    conn = psycopg2.connect(os.environ.get('DATABASE_URL'))
    cursor = conn.cursor()
    
    try:
        # 1. Add modern_trust_preview column
        print("\n1. Adding modern_trust_preview column...")
        cursor.execute("ALTER TABLE companies ADD COLUMN IF NOT EXISTS modern_trust_preview TEXT;")
        cursor.execute("ALTER TABLE companies ADD COLUMN IF NOT EXISTS first_name TEXT;")
        cursor.execute("ALTER TABLE companies ADD COLUMN IF NOT EXISTS last_name TEXT;")
        
        # 2. Update modern_trust_preview URLs
        print("2. Generating Modern Trust preview URLs...")
        cursor.execute("""
            UPDATE companies 
            SET modern_trust_preview = 'https://atlasthrust.ai/t/modern-trust/' || slug
            WHERE state IN ('Alabama', 'Arkansas') AND slug IS NOT NULL
        """)
        
        print(f"   Updated {cursor.rowcount} preview URLs")
        
        # 3. Parse email1 into first_name and last_name, clear invalid emails
        print("3. Processing email1 field...")
        cursor.execute("""
            SELECT id, email_1 
            FROM companies 
            WHERE state IN ('Alabama', 'Arkansas') AND email_1 IS NOT NULL
        """)
        
        email_records = cursor.fetchall()
        processed_emails = 0
        cleared_invalid = 0
        
        for company_id, email1 in email_records:
            # Check if email1 contains "invalid" or is clearly not a valid email/name
            if (not email1 or 
                'invalid' in email1.lower() or 
                email1.strip() == '' or
                email1.lower() in ['null', 'none', 'n/a']):
                
                # Clear invalid email1
                cursor.execute("""
                    UPDATE companies 
                    SET email_1 = NULL, first_name = NULL, last_name = NULL
                    WHERE id = %s
                """, (company_id,))
                cleared_invalid += 1
            else:
                # Parse name from email1
                first_name, last_name = parse_email_name(email1)
                
                cursor.execute("""
                    UPDATE companies 
                    SET first_name = %s, last_name = %s
                    WHERE id = %s
                """, (first_name, last_name, company_id))
                processed_emails += 1
        
        print(f"   Processed {processed_emails} valid emails")
        print(f"   Cleared {cleared_invalid} invalid emails")
        
        # 4. Drop unnecessary columns
        print("4. Removing unnecessary columns...")
        unnecessary_columns = [
            'settings', 'multitrack', 'hours', 'saturday_hours', 'sunday_hours',
            'emergency_service', 'ram', 'ram_color', 'async_color', 
            'multitrack_settings', 'forced_working_hours', 'original_working_hours'
        ]
        
        for column in unnecessary_columns:
            try:
                cursor.execute(f"ALTER TABLE companies DROP COLUMN IF EXISTS {column}")
                print(f"   Dropped column: {column}")
            except Exception as e:
                print(f"   Column {column} doesn't exist or couldn't be dropped")
        
        conn.commit()
        
        # 5. Export Alabama businesses CSV
        print("\n5. Exporting clean Alabama businesses CSV...")
        cursor.execute("""
            SELECT 
                id, name, slug, city, state, phone, rating, reviews, place_id,
                reviews_link, predicted_label, r_30, r_60, r_90, r_365,
                first_review_date, parsed_working_hours, email_1, site,
                latitude, longitude, first_name, last_name, modern_trust_preview,
                created_at, updated_at
            FROM companies 
            WHERE state = 'Alabama'
            ORDER BY city, name
        """)
        
        alabama_businesses = cursor.fetchall()
        
        with open('clean_alabama_businesses.csv', 'w', newline='', encoding='utf-8') as f:
            writer = csv.writer(f)
            writer.writerow([
                'id', 'name', 'slug', 'city', 'state', 'phone', 'rating', 'reviews',
                'place_id', 'reviews_link', 'predicted_label', 'r_30', 'r_60', 'r_90',
                'r_365', 'first_review_date', 'parsed_working_hours', 'email_1', 'site',
                'latitude', 'longitude', 'first_name', 'last_name', 'modern_trust_preview',
                'created_at', 'updated_at'
            ])
            writer.writerows(alabama_businesses)
        
        print(f"   Alabama: {len(alabama_businesses)} businesses exported")
        
        # 6. Export Arkansas businesses CSV
        print("6. Exporting clean Arkansas businesses CSV...")
        cursor.execute("""
            SELECT 
                id, name, slug, city, state, phone, rating, reviews, place_id,
                reviews_link, predicted_label, r_30, r_60, r_90, r_365,
                first_review_date, parsed_working_hours, email_1, site,
                latitude, longitude, first_name, last_name, modern_trust_preview,
                created_at, updated_at
            FROM companies 
            WHERE state = 'Arkansas'
            ORDER BY city, name
        """)
        
        arkansas_businesses = cursor.fetchall()
        
        with open('clean_arkansas_businesses.csv', 'w', newline='', encoding='utf-8') as f:
            writer = csv.writer(f)
            writer.writerow([
                'id', 'name', 'slug', 'city', 'state', 'phone', 'rating', 'reviews',
                'place_id', 'reviews_link', 'predicted_label', 'r_30', 'r_60', 'r_90',
                'r_365', 'first_review_date', 'parsed_working_hours', 'email_1', 'site',
                'latitude', 'longitude', 'first_name', 'last_name', 'modern_trust_preview',
                'created_at', 'updated_at'
            ])
            writer.writerows(arkansas_businesses)
        
        print(f"   Arkansas: {len(arkansas_businesses)} businesses exported")
        
        # 7. Final status report
        cursor.execute("""
            SELECT 
                state,
                COUNT(*) as total,
                COUNT(CASE WHEN modern_trust_preview IS NOT NULL THEN 1 END) as with_preview,
                COUNT(CASE WHEN first_name IS NOT NULL THEN 1 END) as with_first_name,
                COUNT(CASE WHEN email_1 IS NOT NULL THEN 1 END) as with_valid_email
            FROM companies 
            WHERE state IN ('Alabama', 'Arkansas')
            GROUP BY state
            ORDER BY state
        """)
        
        print("\n=== FINAL STATUS ===")
        for state, total, with_preview, with_first_name, with_valid_email in cursor.fetchall():
            print(f"{state}: {total} businesses")
            print(f"  With preview URL: {with_preview}")
            print(f"  With first name: {with_first_name}")
            print(f"  With valid email: {with_valid_email}")
        
        print(f"\nClean CSV files created:")
        print(f"- clean_alabama_businesses.csv ({len(alabama_businesses)} businesses)")
        print(f"- clean_arkansas_businesses.csv ({len(arkansas_businesses)} businesses)")
        
        # Show sample of new data structure
        cursor.execute("""
            SELECT name, first_name, last_name, email_1, modern_trust_preview
            FROM companies 
            WHERE state = 'Alabama' AND first_name IS NOT NULL
            LIMIT 3
        """)
        
        print(f"\nSample processed data:")
        for name, first_name, last_name, email_1, preview_url in cursor.fetchall():
            print(f"  {name}: {first_name} {last_name} | {email_1} | {preview_url}")
        
    except Exception as e:
        conn.rollback()
        print(f"Error: {str(e)}")
    finally:
        cursor.close()
        conn.close()

if __name__ == "__main__":
    main()