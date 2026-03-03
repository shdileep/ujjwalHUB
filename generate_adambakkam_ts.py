import csv
import json

def to_title_case(s):
    return s.title() if s.isupper() else s

bins = []
with open('adambakkam_bins.csv', 'r') as f:
    reader = csv.reader(f)
    for row in reader:
        if not row: continue
        # Row format:
        # 0: 8403 (id suffix?)
        # 1: N12
        # 2: N161
        # 3: ADAMBAKKAM (Location?)
        # 4: ADAMBAKKAM (Area?)
        # 5: OFFICERS COLONY MIDDLE STREET (Street?)
        # 6: S_W161_001 (ID)
        # 7: 12.9948 (Lat)
        # 8: 80.205007 (Lng)
        # 9: 80.2050069 (Lng?)
        # 10: 12.9948002 (Lat?)
        # 11: Full (Status)
        
        # We need to map this to the Bin interface in types.ts
        # interface Bin {
        #   id: string;
        #   locationName: string;
        #   areaName: string;
        #   streetName: string;
        #   coordinates: { lat: number; lng: number };
        #   status: 'Full' | 'Half Full' | 'Empty' | 'Completed';
        #   ...
        # }

        bin_data = {
            "id": row[6],
            "locationName": to_title_case(row[3]), # Using col 3 as location name
            "areaName": "Adambakkam", 
            "streetName": to_title_case(row[5]),
            "coordinates": {
                "lat": float(row[7]),
                "lng": float(row[8])
            },
            "status": row[11].strip()
        }
        bins.append(bin_data)

# Output as TS array content
print("export const ADAMBAKKAM_BINS_NEW = " + json.dumps(bins, indent=2) + ";")
