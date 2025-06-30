import pandas as pd
import sys

# Read the CSV file
input_file = "Arkansas HVAC Updated - Outscraper-20250604031753m44_hvac_contractor_arkansas.csv"
output_file = "Arkansas_HVAC_Filtered_Mobile_VOIP.csv"

print("Reading CSV file...")
df = pd.read_csv(input_file, low_memory=False)

print(f"Original CSV has {len(df)} rows")

# Filter for mobile or voip in the carrier_type column
carrier_type_col = "phone.phones_enricher.carrier_type"
filtered_df = df[df[carrier_type_col].isin(['mobile', 'voip'])]

print(f"Filtered CSV has {len(filtered_df)} rows (MOBILE or VOIP only)")

# Save the filtered CSV
filtered_df.to_csv(output_file, index=False)
print(f"Filtered CSV saved as: {output_file}")