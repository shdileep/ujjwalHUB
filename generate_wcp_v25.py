import json
import random

def generate_bins():
    # Linear spread along roads
    # Mambakkam: Main Road (Approx 12.8685, 80.1740 to 12.8720, 80.1780)
    # Melakottaiyur: Vandalur-Kelambakkam Rd (Approx 12.8250, 80.1150 to 12.8280, 80.1180)
    # Kandigai: Main Junction area (Approx 12.8474, 80.1442 to 12.8500, 80.1480)

    districts = [
        {
            "name": "Mambakkam", "count": 15, "full": 7, "half": 4, "empty": 4,
            "start": {"lat": 12.8680, "lng": 80.1730},
            "end": {"lat": 12.8750, "lng": 80.1800}
        },
        {
            "name": "Melakottaiyur", "count": 15, "full": 7, "half": 5, "empty": 3,
            "start": {"lat": 12.8220, "lng": 80.1120},
            "end": {"lat": 12.8300, "lng": 80.1200}
        },
        {
            "name": "Kandigai", "count": 16, "full": 8, "half": 4, "empty": 4,
            "start": {"lat": 12.8450, "lng": 80.1420},
            "end": {"lat": 12.8520, "lng": 80.1490}
        }
    ]

    bins = []
    global_id = 1

    for d in districts:
        total = d["count"]
        statuses = (["Full"] * d["full"]) + (["Half Full"] * d["half"]) + (["Empty"] * d["empty"])
        random.shuffle(statuses)

        # Interpolate positions
        for i in range(total):
            ratio = i / (total - 1) if total > 1 else 0.5
            lat = d["start"]["lat"] + (d["end"]["lat"] - d["start"]["lat"]) * ratio
            lng = d["start"]["lng"] + (d["end"]["lng"] - d["start"]["lng"]) * ratio
            
            # Add small random jitter (approx 10-20m)
            lat += (random.random() - 0.5) * 0.0002
            lng += (random.random() - 0.5) * 0.0002

            bin_data = {
                # Format: "01", "02" ... "46"
                "id": str(global_id).zfill(2),
                "areaName": "West Chengalpattu",
                "locationName": d["name"],
                "streetName": f"{d['name']} Main Road {i+1}",
                "coordinates": {
                    "lat": round(lat, 6),
                    "lng": round(lng, 6)
                },
                "status": statuses[i]
            }
            bins.append(bin_data)
            global_id += 1

    # Output TS format
    with open('constants/westChengalpattuBins.ts', 'w', encoding='utf-8') as f:
        f.write("import { Bin } from '../types';\n\n")
        f.write("export const WEST_CHENGALPATTU_BINS: Bin[] = [\n")
        
        for i, b in enumerate(bins):
            comma = "," if i < len(bins) - 1 else ""
            f.write(f"  {json.dumps(b, indent=4)}{comma}\n")

        f.write("];\n")

if __name__ == "__main__":
    generate_bins()
