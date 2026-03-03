
import pandas as pd
import sys

LOG_FILE = 'c:/ujjwal/analysis_log_py.txt'

def log(msg):
    with open(LOG_FILE, 'a') as f:
        f.write(str(msg) + '\n')

try:
    log("Starting Python analysis...")
    df = pd.read_csv('c:/ujjwal/chennai_bins_with_status.csv')
    log(f"Total Rows: {len(df)}")
    
    unique_areas = df['AREA_NAME'].unique()
    log(f"Unique AREA_NAMEs ({len(unique_areas)}):")
    for area in unique_areas:
        log(f" - {area}")
        
    log("-" * 20)
    
    # Check for Guindy/Alandur in LOC_NAME
    alandur_matches = df[df['LOC_NAME'].str.contains('Alandur', case=False, na=False)]
    log(f"Rows with 'Alandur' in LOC_NAME: {len(alandur_matches)}")
    
    guindy_matches = df[df['LOC_NAME'].str.contains('Guindy', case=False, na=False)]
    log(f"Rows with 'Guindy' in LOC_NAME: {len(guindy_matches)}")
    
    ekkatt_matches = df[df['LOC_NAME'].str.contains('Ekkattu', case=False, na=False)]
    log(f"Rows with 'Ekkattu' in LOC_NAME: {len(ekkatt_matches)}")

    log("Sample Alandur Matches:")
    if not alandur_matches.empty:
        log(alandur_matches[['AREA_NAME', 'LOC_NAME']].head().to_string())

except Exception as e:
    log(f"CRITICAL ERROR: {e}")
    sys.exit(1)
