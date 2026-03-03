
import pandas as pd
import json
import os

files = [
    r'c:\ujjwal\chengalpattu_ujjwal_areas_summary.xlsx',
    r'c:\ujjwal\chennai_ujjwal_areas_summary.xlsx'
]

mapping = {}

for f in files:
    try:
        if os.path.exists(f):
            df = pd.read_excel(f)
            # Normalize column names
            df.columns = [c.strip() for c in df.columns]
            
            if 'Ujjwal Area Name' in df.columns and 'Component Areas' in df.columns:
                for index, row in df.iterrows():
                    area = str(row['Ujjwal Area Name']).strip()
                    components = str(row['Component Areas']).strip()
                    
                    if area and area != 'nan' and components and components != 'nan':
                        # Split components by comma and clean
                        comp_list = [c.strip() for c in components.split(',')]
                        mapping[area] = comp_list
            else:
                print(f"Columns not found in {f}: {df.columns.tolist()}")

    except Exception as e:
        print(f"Error reading {f}: {e}")

with open('c:/ujjwal/area_mapping.json', 'w') as f:
    json.dump(mapping, f, indent=2)
