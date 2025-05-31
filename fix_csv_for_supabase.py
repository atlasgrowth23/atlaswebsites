#!/usr/bin/env python3
import pandas as pd
import json
from datetime import datetime

print("Loading and fixing CSV for Supabase...")

# Load the combined CSV
df = pd.read_csv('combined_alabama_arkansas_fixed_r365.csv')

print(f"Original columns: {list(df.columns)}")

# Fix column names - remove special characters
df.columns = df.columns.str.replace('[^a-zA-Z0-9_-]', '_', regex=True)

# Fix datetime columns to YYYY-MM-DD HH:mm:ss format
if 'created_at' in df.columns:
    df['created_at'] = pd.to_datetime(df['created_at'], errors='coerce').dt.strftime('%Y-%m-%d %H:%M:%S')

if 'updated_at' in df.columns:
    df['updated_at'] = pd.to_datetime(df['updated_at'], errors='coerce').dt.strftime('%Y-%m-%d %H:%M:%S')

# Fix first_review_date format (convert MM/YYYY to YYYY-MM-01 00:00:00)
if 'first_review_date' in df.columns:
    def fix_review_date(date_str):
        if pd.isna(date_str) or date_str == '':
            return None
        try:
            # Handle MM/YYYY format
            if '/' in str(date_str):
                month, year = str(date_str).split('/')
                return f"{year}-{month.zfill(2)}-01 00:00:00"
            return None
        except:
            return None
    
    df['first_review_date'] = df['first_review_date'].apply(fix_review_date)

# Fix JSON columns - convert to proper JSON strings
if 'parsed_working_hours' in df.columns:
    def fix_json(json_str):
        if pd.isna(json_str) or json_str == '':
            return None
        try:
            # If it's already a valid JSON string, return it
            if isinstance(json_str, str) and json_str.startswith('{'):
                json.loads(json_str)  # Test if valid
                return json_str
            return None
        except:
            return None
    
    df['parsed_working_hours'] = df['parsed_working_hours'].apply(fix_json)

# Convert numeric columns to proper types
numeric_columns = ['rating', 'reviews', 'r_30', 'r_60', 'r_90', 'r_365', 'review_count', 'latitude', 'longitude']
for col in numeric_columns:
    if col in df.columns:
        df[col] = pd.to_numeric(df[col], errors='coerce')

# Convert boolean columns
if 'emergency_service' in df.columns:
    df['emergency_service'] = df['emergency_service'].fillna(False).astype(bool)

# Remove any completely empty rows
df = df.dropna(how='all')

# Replace NaN with None for proper NULL handling
df = df.where(pd.notnull(df), None)

print(f"Fixed columns: {list(df.columns)}")
print(f"Rows: {len(df)}")

# Save the fixed CSV
output_file = 'supabase_ready.csv'
df.to_csv(output_file, index=False, na_rep='')

print(f"✅ Supabase-ready CSV saved as: {output_file}")

# Show sample data
print("\nSample data:")
print(df.head(2).to_string())