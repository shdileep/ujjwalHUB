
import csv
import json

csv_path = 'adambakkam_bins.csv'
ts_path = 'constants/adambakkamFixed.ts'

bins = []

with open(csv_path, 'r', encoding='utf-8') as f:
    reader = csv.reader(f)
    # Check if header exists. First row (8403) looks like data.
    # We will assume no header or handle it.
    
    rows = list(reader)
    
    # Simple check if first row is header
    if rows[0][0] == 'id' or rows[0][0] == 'ID':
        rows = rows[1:]

    for idx, row in enumerate(rows):
        if not row: continue
        
        # Mapping based on observation
        # 0: 8403 (Old ID)
        # 5: Street
        # 7: Lat
        # 8: Lng
        # 11: Status
        
        try:
            new_id = f"{idx+1:02d}"
            street = row[5]
            lat = float(row[7])
            lng = float(row[8])
            status = row[11].strip() if len(row) > 11 else 'Empty'
            
            # Normalize status
            if status not in ['Full', 'Half Full', 'Empty', 'Completed']:
                status = 'Empty'

            bin_obj = {
                "id": new_id,
                "areaName": "ADAMBAKKAM",
                "locationName": "ADAMBAKKAM",
                "streetName": street,
                "coordinates": { "lat": lat, "lng": lng },
                "status": status,
                "imageUrl": "https://images.unsplash.com/photo-1532996122724-e3c354a0b15b?auto=format&fit=crop&w=800&q=80",
                "assignedDriverId": "DRV001",
                "lastPickupTime": "2023-10-27T08:30:00Z",
                "fillLevel": 100 if status == 'Full' else (50 if status == 'Half Full' else 0)
            }
            bins.append(bin_obj)
        except Exception as e:
            print(f"Skipping row {idx}: {e}")

print(f"Generated {len(bins)} bins.")

ts_content = f"""import {{ Bin }} from '../types';

export const ADAMBAKKAM_FIXED: Bin[] = {json.dumps(bins, indent=2)};
"""

with open(ts_path, 'w', encoding='utf-8') as f:
    f.write(ts_content)

print(f"Verified writing to {ts_path}")
