
import pandas as pd

try:
    df = pd.read_csv('chennai_bins_with_status.csv')
    print("Total Rows:", len(df))
    print("\nUnique AREA_NAMEs:", df['AREA_NAME'].unique())
    
    # Check for Guindy variations
    guindy_matches = df[df['AREA_NAME'].str.contains('Guindy', case=False, na=False)]
    print(f"\nRows with 'Guindy' in AREA_NAME: {len(guindy_matches)}")
    
    alandur_matches = df[df['LOC_NAME'].str.contains('Alandur', case=False, na=False)]
    print(f"Rows with 'Alandur' in LOC_NAME: {len(alandur_matches)}")

    ekkatt_matches = df[df['LOC_NAME'].str.contains('Ekkattu', case=False, na=False)]
    print(f"Rows with 'Ekkattu' in LOC_NAME: {len(ekkatt_matches)}")

    # Print first few rows of Alandur matches
    if not alandur_matches.empty:
        print("\nSample Alandur rows:")
        print(alandur_matches[['AREA_NAME', 'LOC_NAME']].head())

except Exception as e:
    print(f"Error: {e}")
