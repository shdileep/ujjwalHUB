import json
import random

# Configuration
# Coordinates:
# Kandigai: 12.8465, 80.1450
# Nallambakkam: 12.8119, 80.1149
# Vengadamgalam: 12.8306, 80.1411 (approx)
LOCATIONS = [
    {"name": "Kandigai", "lat": 12.8465, "lng": 80.1450},
    {"name": "Nallambakkam", "lat": 12.8118756, "lng": 80.1148888},
    {"name": "Vengadamgalam", "lat": 12.8306297, "lng": 80.1410752}
]

TOTAL_BINS = 40
# Distribution
# 13 bins in Kandigai
# 13 bins in Nallambakkam
# 14 bins in Vengadamgalam
# Total = 40

# Status Distribution
STATUS_COUNTS = {
    "Full": 20,
    "Half Full": 13,
    "Empty": 7
}

def generate_bins():
    bins = []
    
    # Create pool of statuses
    status_pool = []
    for status, count in STATUS_COUNTS.items():
        status_pool.extend([status] * count)
    
    # Shuffle statuses
    random.shuffle(status_pool)
    
    status_idx = 0
    bin_counter = 1
    
    # Distribute bins approx evenly
    bins_per_loc = [13, 13, 14] 
    
    for idx, loc in enumerate(LOCATIONS):
        count = bins_per_loc[idx]
        for i in range(count):
            # Accurate placement (low jitter)
            # 0.001 degrees is roughly 110m
            lat_jitter = random.uniform(-0.001, 0.001)
            lng_jitter = random.uniform(-0.001, 0.001)
            
            bin_data = {
                "id": f"WCP_{bin_counter:02d}",
                "areaName": "West Chengalpattu",
                "locationName": loc["name"],
                "streetName": f"{loc['name']} Street {i+1}",
                "coordinates": {
                    "lat": round(loc["lat"] + lat_jitter, 6),
                    "lng": round(loc["lng"] + lng_jitter, 6)
                },
                "status": status_pool[status_idx]
            }
            bins.append(bin_data)
            status_idx += 1
            bin_counter += 1
            
    return bins

if __name__ == "__main__":
    bins = generate_bins()
    
    # Generate TypeScript content
    ts_content = "import { Bin } from '../types';\n\n"
    ts_content += "export const WEST_CHENGALPATTU_BINS: Bin[] = "
    ts_content += json.dumps(bins, indent=2)
    ts_content += ";\n"
    
    output_path = 'c:/ujjwal/constants/westChengalpattuBins.ts'
    with open(output_path, 'w', encoding='utf-8') as f:
        f.write(ts_content)
        
    print(f"Successfully wrote {len(bins)} bins to {output_path}")
