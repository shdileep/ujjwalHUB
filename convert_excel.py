
import pandas as pd
import sys

try:
    print("Starting conversion...")
    df = pd.read_excel('chennai_ujjwal_areas_summary.xlsx')
    print("Excel extracted. Columns:", df.columns.tolist())
    df.to_csv('chennai_ujjwal_areas_summary.csv', index=False)
    print("Conversion successful.")
except Exception as e:
    print(f"Error: {e}")
    sys.exit(1)
