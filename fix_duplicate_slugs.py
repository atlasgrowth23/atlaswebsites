#!/usr/bin/env python3
import pandas as pd

print("Fixing duplicate slugs...")

# Load the CSV
df = pd.read_csv('supabase_ready_fixed_domain.csv')

print(f"Original rows: {len(df)}")

# Check for duplicate slugs
duplicate_slugs = df[df.duplicated(subset=['slug'], keep=False)]
print(f"Rows with duplicate slugs: {len(duplicate_slugs)}")

if len(duplicate_slugs) > 0:
    print("Duplicate slugs found:")
    for slug in duplicate_slugs['slug'].unique():
        count = len(duplicate_slugs[duplicate_slugs['slug'] == slug])
        print(f"  {slug}: {count} duplicates")

# Fix duplicate slugs by adding state suffix
def make_unique_slug(row, seen_slugs):
    base_slug = row['slug']
    state = row['state'].lower() if pd.notna(row['state']) else 'unknown'
    
    if base_slug not in seen_slugs:
        seen_slugs.add(base_slug)
        return base_slug
    
    # Add state suffix
    new_slug = f"{base_slug}-{state}"
    counter = 1
    
    # If still duplicate, add number
    while new_slug in seen_slugs:
        new_slug = f"{base_slug}-{state}-{counter}"
        counter += 1
    
    seen_slugs.add(new_slug)
    return new_slug

# Apply unique slug generation
seen_slugs = set()
df['slug'] = df.apply(lambda row: make_unique_slug(row, seen_slugs), axis=1)

# Verify no duplicates
final_duplicates = df[df.duplicated(subset=['slug'], keep=False)]
print(f"Remaining duplicate slugs after fix: {len(final_duplicates)}")

# Save fixed CSV
output_file = 'supabase_ready_no_duplicates.csv'
df.to_csv(output_file, index=False, na_rep='')

print(f"✅ Fixed CSV saved as: {output_file}")
print(f"Total rows: {len(df)}")
print(f"Unique slugs: {df['slug'].nunique()}")