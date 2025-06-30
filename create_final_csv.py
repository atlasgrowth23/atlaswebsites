import pandas as pd

# Read the filtered CSV file
input_file = "Arkansas_HVAC_Filtered_Mobile_VOIP.csv"
output_file = "Arkansas_HVAC_Final_No_Website.csv"

print("Reading filtered CSV file...")
df = pd.read_csv(input_file, low_memory=False)

print(f"Starting with {len(df)} rows")

# Filter for blank/null websites only
df_no_website = df[df['site'].isna()]
print(f"After filtering for no website: {len(df_no_website)} rows")

# Select only the columns we want
columns_to_keep = [
    'name',
    'phone', 
    'phone.phones_enricher.carrier_type',
    'full_address',
    'city',
    'state',
    'rating',
    'reviews',
    'reviews_link'
]

# Create the final dataframe with selected columns
final_df = df_no_website[columns_to_keep].copy()

# Add the business_niche column and set all to "HVAC"
final_df['business_niche'] = 'HVAC'

# Reorder columns to put business_niche at the end
column_order = columns_to_keep + ['business_niche']
final_df = final_df[column_order]

print(f"Final CSV will have {len(final_df)} rows and {len(final_df.columns)} columns")

# Save the final CSV
final_df.to_csv(output_file, index=False)
print(f"Final CSV saved as: {output_file}")

# Show column names for verification
print(f"\nColumns in final CSV: {list(final_df.columns)}")