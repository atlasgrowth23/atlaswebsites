#!/usr/bin/env python3
import pandas as pd
from datetime import datetime, timedelta
import json

print("Loading data...")

# Load the business data
alabama_df = pd.read_csv('clean_alabama_businesses.csv')
arkansas_df = pd.read_csv('clean_arkansas_businesses.csv')

# Load review data
reviews_df = pd.read_csv('public/merged-reviews-with-companies.csv')

print(f"Alabama businesses: {len(alabama_df)}")
print(f"Arkansas businesses: {len(arkansas_df)}")
print(f"Total reviews: {len(reviews_df)}")

# Combine Alabama and Arkansas
combined_df = pd.concat([alabama_df, arkansas_df], ignore_index=True)
print(f"Combined businesses: {len(combined_df)}")

# Convert review dates to datetime
reviews_df['published_date'] = pd.to_datetime(reviews_df['published_date'], errors='coerce')

# Calculate cutoff dates (make them timezone-aware)
now = pd.Timestamp.now(tz='UTC')
cutoff_365 = now - timedelta(days=365)
cutoff_90 = now - timedelta(days=90)
cutoff_60 = now - timedelta(days=60)
cutoff_30 = now - timedelta(days=30)

print(f"Calculating R365 for reviews after: {cutoff_365.date()}")

# Function to count reviews in time periods
def count_reviews_by_period(company_name):
    company_reviews = reviews_df[reviews_df['company_name'] == company_name]
    
    # Filter out invalid dates
    valid_reviews = company_reviews.dropna(subset=['published_date'])
    
    r_30 = len(valid_reviews[valid_reviews['published_date'] >= cutoff_30])
    r_60 = len(valid_reviews[valid_reviews['published_date'] >= cutoff_60])
    r_90 = len(valid_reviews[valid_reviews['published_date'] >= cutoff_90])
    r_365 = len(valid_reviews[valid_reviews['published_date'] >= cutoff_365])
    
    return r_30, r_60, r_90, r_365

# Fix R365 and other time period counts
print("Fixing R365 calculations...")

for idx, row in combined_df.iterrows():
    company_name = row['name']
    r_30, r_60, r_90, r_365 = count_reviews_by_period(company_name)
    
    # Update the dataframe
    combined_df.at[idx, 'r_30'] = r_30
    combined_df.at[idx, 'r_60'] = r_60
    combined_df.at[idx, 'r_90'] = r_90
    combined_df.at[idx, 'r_365'] = r_365
    
    if idx % 50 == 0:
        print(f"Processed {idx}/{len(combined_df)} companies...")

# Save the combined and fixed CSV
output_file = 'combined_alabama_arkansas_fixed_r365.csv'
combined_df.to_csv(output_file, index=False)

print(f"\n✅ Combined and fixed CSV saved as: {output_file}")
print(f"Total companies: {len(combined_df)}")

# Show some examples of fixed R365
print("\nExamples of R365 fixes:")
for i in range(min(5, len(combined_df))):
    row = combined_df.iloc[i]
    print(f"{row['name']}: Total reviews={row['reviews']}, R365 was={row['r_365']} (now fixed)")

print("\nDone!")