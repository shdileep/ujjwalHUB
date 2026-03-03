import json

def parse_and_generate():
    bins = []
    
    with open('west_chengalpattu_v35_raw.txt', 'r', encoding='utf-8') as f:
        lines = f.readlines()

    # Skip header
    for line in lines[1:]:
        parts = line.strip().split('\t')
        if len(parts) < 6:
            continue
            
        s_no = parts[0].strip()
        area = parts[1].strip()
        street = parts[2].strip()
        lat = float(parts[3].strip())
        lng = float(parts[4].strip())
        status = parts[5].strip()
        
        # Normalize Status
        if status == "Half-Full":
            status = "Half Full"
            
        # Format ID: 01, 02...
        bin_id = s_no.zfill(2)
        
        bin_data = {
            "id": bin_id,
            "areaName": "West Chengalpattu",
            "locationName": area,
            "streetName": street,
            "coordinates": {
                "lat": lat,
                "lng": lng
            },
            "status": status
        }
        bins.append(bin_data)

    # Output TS format
    with open('constants/westChengalpattuBins.ts', 'w', encoding='utf-8') as f:
        f.write("import { Bin } from '../types';\n\n")
        f.write("export const WEST_CHENGALPATTU_BINS: Bin[] = [\n")
        
        for i, b in enumerate(bins):
            comma = "," if i < len(bins) - 1 else ""
            f.write(f"  {json.dumps(b, indent=4)}{comma}\n")

        f.write("];\n")
        
    print(f"Generated {len(bins)} bins.")

if __name__ == "__main__":
    parse_and_generate()
