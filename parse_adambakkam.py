
import csv
import json

def to_title_case(s):
    return s.title() if s.isupper() else s

bins = []
with open('adambakkam_bins.csv', 'r') as f:
    reader = csv.reader(f)
    for row in reader:
        if not row: continue
        # 8403,N12,N161,ADAMBAKKAM,ADAMBAKKAM,OFFICERS COLONY MIDDLE STREET,S_W161_001,12.9948,80.205007,80.2050069,12.9948002,Full
        # 0    1   2    3          4          5                              6          7       8         9          10         11
        
        bin_data = {
            "id": row[6],
            "locationName": to_title_case(row[3]),
            "areaName": "Adambakkam", # Force title case for consistency
            "streetName": to_title_case(row[5]),
            "coordinates": {
                "lat": float(row[7]),
                "lng": float(row[8])
            },
            "status": row[11].strip()
        }
        bins.append(bin_data)

print(json.dumps(bins, indent=2))
