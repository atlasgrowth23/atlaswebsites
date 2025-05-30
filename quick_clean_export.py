#!/usr/bin/env python3
"""
Quick database cleanup and export - efficient batch processing
"""

import csv
import os
import psycopg2
import re

def parse_name_from_email(email_value):
    """Extract first/last name from email field"""
    if not email_value or 'invalid' in email_value.lower():
        return None, None
    
    name_part = email_value.split('@')[0]
    name_part = re.sub(r'[._\-0-9]+', ' ', name_part).strip()
    
    words = [w.capitalize() for w in name_part.split() if w]
    return (words[0], words[1]) if len(words) >= 2 else (words[0], None) if words else (None, None)

def main():
    print("=== QUICK DATABASE CLEANUP ===")
    
    conn = psycopg2.connect(os.environ.get('DATABASE_URL'))
    cursor = conn.cursor()
    
    try:
        # 1. Add new columns
        print("1. Adding columns...")
        cursor.execute("ALTER TABLE companies ADD COLUMN IF NOT EXISTS modern_trust_preview TEXT;")
        cursor.execute("ALTER TABLE companies ADD COLUMN IF NOT EXISTS first_name TEXT;")
        cursor.execute("ALTER TABLE companies ADD COLUMN IF NOT EXISTS last_name TEXT;")
        
        # 2. Update preview URLs
        print("2. Adding preview URLs...")
        cursor.execute("""
            UPDATE companies 
            SET modern_trust_preview = 'https://atlasthrust.ai/t/modern-trust/' || slug
            WHERE state IN ('Alabama', 'Arkansas') AND slug IS NOT NULL
        """)
        
        # 3. Process emails in batches
        print("3. Processing emails...")
        cursor.execute("SELECT id, email_1 FROM companies WHERE state IN ('Alabama', 'Arkansas')")
        emails = cursor.fetchall()
        
        batch_size = 100
        for i in range(0, len(emails), batch_size):
            batch = emails[i:i + batch_size]
            
            for company_id, email1 in batch:
                if email1 and 'invalid' not in email1.lower():
                    first_name, last_name = parse_name_from_email(email1)
                    cursor.execute("""
                        UPDATE companies 
                        SET first_name = %s, last_name = %s
                        WHERE id = %s
                    """, (first_name, last_name, company_id))
                else:
                    cursor.execute("UPDATE companies SET email_1 = NULL WHERE id = %s", (company_id,))
            
            conn.commit()
            print(f"   Batch {i//batch_size + 1} complete")
        
        # 4. Drop unnecessary columns
        print("4. Cleaning columns...")
        drop_columns = ['settings', 'multitrack', 'hours', 'saturday_hours', 'sunday_hours', 
                       'emergency_service', 'ram', 'ram_color', 'async_color']
        
        for col in drop_columns:
            try:
                cursor.execute(f"ALTER TABLE companies DROP COLUMN IF EXISTS {col}")
            except:
                pass
        
        # 5. Export Alabama
        print("5. Exporting Alabama...")
        cursor.execute("""
            SELECT id, name, slug, city, state, phone, rating, reviews, place_id,
                   reviews_link, predicted_label, r_30, r_60, r_90, r_365,
                   first_review_date, parsed_working_hours, email_1, site,
                   latitude, longitude, first_name, last_name, modern_trust_preview
            FROM companies WHERE state = 'Alabama' ORDER BY city, name
        """)
        
        with open('clean_alabama_businesses.csv', 'w', newline='', encoding='utf-8') as f:
            writer = csv.writer(f)
            writer.writerow(['id', 'name', 'slug', 'city', 'state', 'phone', 'rating', 'reviews',
                           'place_id', 'reviews_link', 'predicted_label', 'r_30', 'r_60', 'r_90',
                           'r_365', 'first_review_date', 'parsed_working_hours', 'email_1', 'site',
                           'latitude', 'longitude', 'first_name', 'last_name', 'modern_trust_preview'])
            writer.writerows(cursor.fetchall())
        
        # 6. Export Arkansas  
        print("6. Exporting Arkansas...")
        cursor.execute("""
            SELECT id, name, slug, city, state, phone, rating, reviews, place_id,
                   reviews_link, predicted_label, r_30, r_60, r_90, r_365,
                   first_review_date, parsed_working_hours, email_1, site,
                   latitude, longitude, first_name, last_name, modern_trust_preview
            FROM companies WHERE state = 'Arkansas' ORDER BY city, name
        """)
        
        with open('clean_arkansas_businesses.csv', 'w', newline='', encoding='utf-8') as f:
            writer = csv.writer(f)
            writer.writerow(['id', 'name', 'slug', 'city', 'state', 'phone', 'rating', 'reviews',
                           'place_id', 'reviews_link', 'predicted_label', 'r_30', 'r_60', 'r_90',
                           'r_365', 'first_review_date', 'parsed_working_hours', 'email_1', 'site',
                           'latitude', 'longitude', 'first_name', 'last_name', 'modern_trust_preview'])
            writer.writerows(cursor.fetchall())
        
        print("7. Complete! Files created:")
        print("   - clean_alabama_businesses.csv")
        print("   - clean_arkansas_businesses.csv")
        
    except Exception as e:
        print(f"Error: {e}")
    finally:
        cursor.close()
        conn.close()

if __name__ == "__main__":
    main()