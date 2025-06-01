#!/usr/bin/env python3
"""
Check for duplicate slugs within the CSV file itself
"""
import pandas as pd

def check_csv_duplicates():
    print("🔍 Checking for duplicate slugs within CSV...")
    
    # Read the cleaned CSV
    csv_file = '/home/runner/workspace/supabase_companies_clean.csv'
    df = pd.read_csv(csv_file)
    
    print(f"📊 Total companies in CSV: {len(df)}")
    
    # Check for duplicate slugs
    duplicate_slugs = df[df.duplicated(subset=['slug'], keep=False)]
    
    if len(duplicate_slugs) > 0:
        print(f"❌ Found {len(duplicate_slugs)} companies with duplicate slugs!")
        
        # Group by slug to show duplicates
        grouped = duplicate_slugs.groupby('slug')
        
        print("\n📋 Duplicate slugs found:")
        for slug, group in grouped:
            print(f"\n  Slug: '{slug}' ({len(group)} duplicates)")
            for idx, row in group.iterrows():
                print(f"    - {row['name']} ({row['city']}, {row['state']})")
        
        print(f"\n🎯 SOLUTION: Remove duplicates before import")
        
        # Generate deduplicated CSV
        print("\n🔧 Generating deduplicated CSV...")
        df_dedup = df.drop_duplicates(subset=['slug'], keep='first')
        
        output_file = '/home/runner/workspace/supabase_companies_clean_deduped.csv'
        df_dedup.to_csv(output_file, index=False)
        
        removed_count = len(df) - len(df_dedup)
        print(f"✅ Generated deduplicated CSV: {output_file}")
        print(f"📊 Removed {removed_count} duplicates, kept {len(df_dedup)} unique companies")
        
    else:
        print("✅ No duplicate slugs found in CSV")
        print("🤔 The duplicate error might be from a different constraint")
        
        # Check for other potential issues
        print("\n🔍 Checking other potential issues:")
        
        # Check for empty/null slugs
        empty_slugs = df[df['slug'].isna() | (df['slug'] == '')]
        if len(empty_slugs) > 0:
            print(f"❌ Found {len(empty_slugs)} companies with empty slugs")
        else:
            print("✅ All companies have valid slugs")
            
        # Check slug format
        invalid_slugs = df[~df['slug'].str.match(r'^[a-z0-9-]+$', na=False)]
        if len(invalid_slugs) > 0:
            print(f"❌ Found {len(invalid_slugs)} companies with invalid slug format")
            print("First few invalid slugs:")
            for idx, row in invalid_slugs.head(5).iterrows():
                print(f"  - '{row['slug']}' from {row['name']}")
        else:
            print("✅ All slugs have valid format")

if __name__ == "__main__":
    check_csv_duplicates()