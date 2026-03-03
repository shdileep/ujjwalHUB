
import pandas as pd
import json
import os

files = [
    r'c:\ujjwal\chengalpattu_ujjwal_areas_summary.xlsx',
    r'c:\ujjwal\chennai_ujjwal_areas_summary.xlsx'
]

areas = set()

for f in files:
    try:
        if os.path.exists(f):
            df = pd.read_excel(f)
            # Use 'Ujjwal Area Name' column
            if 'Ujjwal Area Name' in df.columns:
                vals = df['Ujjwal Area Name'].dropna().astype(str).tolist()
                for v in vals:
                    v = v.strip()
                    if v:
                        areas.add(v)
            else:
                # Fallback to column index 1 if name doesn't match exactly (e.g. whitespace)
                vals = df.iloc[:, 1].dropna().astype(str).tolist()
                for v in vals:
                    v = v.strip()
                    if v:
                        areas.add(v)

    except Exception as e:
        with open('c:/ujjwal/error_log.txt', 'a') as log:
            log.write(f"Error reading {f}: {e}\n")

sorted_areas = sorted(list(areas))

with open('c:/ujjwal/areas.json', 'w') as f:
    json.dump(sorted_areas, f, indent=2)
