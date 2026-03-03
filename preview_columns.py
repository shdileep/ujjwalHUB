
import pandas as pd
import json
import os

files = [
    r'c:\ujjwal\chengalpattu_ujjwal_areas_summary.xlsx',
    r'c:\ujjwal\chennai_ujjwal_areas_summary.xlsx'
]

preview = {}

for f in files:
    try:
        if os.path.exists(f):
            df = pd.read_excel(f)
            # Convert first 5 rows to dict to see content
            preview[os.path.basename(f)] = df.head(5).to_dict(orient='list')
    except Exception as e:
        preview[os.path.basename(f)] = str(e)

with open('c:/ujjwal/preview.json', 'w') as f:
    json.dump(preview, f, default=str)
