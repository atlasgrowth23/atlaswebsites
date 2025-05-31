import pandas as pd

df = pd.read_csv('supabase_ready_fixed_domain.csv')
# Find every slug that appears more than once
dupes = df['slug'][df['slug'].duplicated(keep=False)].unique()

for slug in dupes:
    # Grab all rows with that slug
    mask = df['slug'] == slug
    # Append a numbered suffix to each duplicate occurrence (except the first)
    for idx, (i, row) in enumerate(df[mask].iterrows()):
        if idx > 0:
            df.at[i, 'slug'] = f"{slug}-{idx}"

df.to_csv('supabase_ready_fixed_domain-deduped-slug.csv', index=False)
