import pandas as pd

# Read the CSV file
input_file = "Arkansas HVAC Updated - Outscraper-20250604031753m44_hvac_contractor_arkansas.csv"

print("Reading CSV file...")
df = pd.read_csv(input_file, low_memory=False)

carrier_type_col = "phone.phones_enricher.carrier_type"

# Check unique values in the carrier_type column
print(f"Unique values in '{carrier_type_col}' column:")
unique_values = df[carrier_type_col].value_counts(dropna=False)
print(unique_values)

# Also check for case-insensitive matches
print("\nChecking for case-insensitive matches:")
mobile_count = df[carrier_type_col].str.upper().eq('MOBILE').sum()
voip_count = df[carrier_type_col].str.upper().eq('VOIP').sum()
print(f"MOBILE (case-insensitive): {mobile_count}")
print(f"VOIP (case-insensitive): {voip_count}")