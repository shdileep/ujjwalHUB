
import pandas as pd
import json
import os

file1 = r'c:\ujjwal\chengalpattu_ujjwal_areas_summary.xlsx'
file2 = r'c:\ujjwal\chennai_ujjwal_areas_summary.xlsx'

areas = []

print("Starting extraction...")
try:
    if os.path.exists(file1):
        try:
            df1 = pd.read_excel(file1)
            # print(f"File 1 loaded. Columns: {df1.columns.tolist()}")
            areas.extend(df1.iloc[:, 0].dropna().astype(str).unique().tolist())
        except Exception as e:
            print(f"Error reading file 1: {e}")
    else:
        print(f"File 1 not found: {file1}")

    if os.path.exists(file2):
        try:
            df2 = pd.read_excel(file2)
            # print(f"File 2 loaded. Columns: {df2.columns.tolist()}")
            areas.extend(df2.iloc[:, 0].dropna().astype(str).unique().tolist())
        except Exception as e:
            print(f"Error reading file 2: {e}")
    else:
        print(f"File 2 not found: {file2}")

    unique_areas = sorted(list(set(areas)))
    
    # Filter out header-like rows if any (simple check)
    cleaned_areas = [a for a in unique_areas if 'Area' not in a and 'Location' not in a]
    
    print(json.dumps(cleaned_areas))

except Exception as e:
    print(f"Global Error: {e}")
