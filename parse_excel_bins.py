import pandas as pd
import json

def to_title_case(s):
    if not isinstance(s, str): return s
    return ' '.join(word.capitalize() for word in s.split())

try:
    df = pd.read_excel('bin_dataset.xlsx')
    
    # Filter for West Chengalpattu related rows if needed, or take all if the file is specific
    # typically looking for 'Kandigai', 'Nallambakkam', 'Kolapakkam', 'Unamancheri'
    # The user said "refer this dataset for the west chengalpattu alone"
    
    bins = []
    
    # expected columns based on user paste: S.NO, Area, Longitude, Latitude, Bin Status
    # Standardize column names
    df.columns = [c.strip().lower() for c in df.columns]
    
    count = 0
    for index, row in df.iterrows():
        # Map columns - adjust based on actual file content if needed, but assuming standard
        area = row.get('area', '')
        if not area: continue
        
        # ID generation
        count += 1
        bin_id = f"WCP_{count:02d}"
        
        lat = row.get('latitude')
        lng = row.get('longitude')
        status = row.get('bin status', 'Empty')
        
        # Clean status
        if 'half' in str(status).lower(): status = 'Half Full'
        elif 'full' in str(status).lower(): status = 'Full'
        else: status = 'Empty'
        
        bin_obj = {
            "id": bin_id,
            "areaName": "West Chengalpattu",
            "locationName": to_title_case(area),
            "streetName": f"{to_title_case(area)} Street {count}",
            "coordinates": {
                "lat": float(lat),
                "lng": float(lng)
            },
            "status": status
        }
        bins.append(bin_obj)

    ts_content = "import { Bin } from '../types';\n\n"
    ts_content += "export const WEST_CHENGALPATTU_BINS: Bin[] = " + json.dumps(bins, indent=2) + ";"
    
    with open('c:/ujjwal/constants/westChengalpattuBins.ts', 'w') as f:
        f.write(ts_content)
        
    print(f"Successfully generated {len(bins)} bins from Excel.")

except Exception as e:
    print(f"Error: {e}")
