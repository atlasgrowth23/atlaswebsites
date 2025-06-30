import pandas as pd

# Read the filtered CSV file
input_file = "Arkansas_HVAC_Filtered_Mobile_VOIP.csv"

print("Reading filtered CSV file...")
df = pd.read_csv(input_file, low_memory=False)

# Check the site column
print(f"Total rows: {len(df)}")
print(f"Rows with blank/null site: {df['site'].isna().sum()}")
print(f"Rows with empty string site: {(df['site'] == '').sum()}")

print("\nSample of site column values:")
print(df['site'].value_counts(dropna=False).head(10))