#!/usr/bin/env python3
"""
Generate cleaned CSV for Supabase companies table import
"""
import pandas as pd
import os

def generate_clean_csv():
    print("🔧 Generating cleaned CSV for Supabase import...")
    
    # Read the source CSV
    input_file = '/home/runner/workspace/combined_alabama_arkansas_fixed_r365.csv'
    
    if not os.path.exists(input_file):
        print(f"❌ Source file not found: {input_file}")
        return
    
    # Read CSV
    df = pd.read_csv(input_file)
    print(f"📊 Loaded {len(df)} companies from source CSV")
    
    # Remove unwanted columns if they exist
    columns_to_remove = ['id', 'first_name', 'last_name', 'created_at', 'updated_at']
    for col in columns_to_remove:
        if col in df.columns:
            df = df.drop(columns=[col])
            print(f"✅ Removed column: {col}")
    
    # Fix atlasthrust.ai → atlasgrowth.ai in modern_trust_preview
    if 'modern_trust_preview' in df.columns:
        original_count = df['modern_trust_preview'].str.contains('atlasthrust.ai', na=False).sum()
        df['modern_trust_preview'] = df['modern_trust_preview'].str.replace(
            'atlasthrust.ai', 'atlasgrowth.ai', regex=False
        )
        print(f"✅ Fixed {original_count} URLs: atlasthrust.ai → atlasgrowth.ai")
    
    # Add logo_storage_path column
    def get_logo_storage_path(row):
        if pd.isna(row.get('predicted_label')):
            return None
        if row['predicted_label'] == 'logo':
            return f"/logos/{row['slug']}.png"
        else:
            return None
    
    df['logo_storage_path'] = df.apply(get_logo_storage_path, axis=1)
    
    # Count logo vs not_logo
    logo_count = len(df[df['predicted_label'] == 'logo'])
    not_logo_count = len(df[df['predicted_label'] == 'not_logo'])
    print(f"📈 Added logo_storage_path: {logo_count} logos, {not_logo_count} text-only")
    
    # Output file
    output_file = '/home/runner/workspace/supabase_companies_clean.csv'
    
    # Save cleaned CSV
    df.to_csv(output_file, index=False)
    print(f"✅ Generated cleaned CSV: {output_file}")
    print(f"📊 Final dataset: {len(df)} companies with {len(df.columns)} columns")
    
    # Show sample of what was generated
    print("\n📋 Sample rows:")
    sample_cols = ['name', 'slug', 'city', 'state', 'predicted_label', 'logo_storage_path', 'modern_trust_preview']
    available_cols = [col for col in sample_cols if col in df.columns]
    print(df[available_cols].head(3).to_string(index=False))
    
    print(f"\n🎯 Ready for manual import into Supabase companies table!")

if __name__ == "__main__":
    generate_clean_csv()