import random
import json
import csv

# Configuration
AREAS = [
    {"name": "Kandigai", "lat": 12.8447, "lng": 80.1436},       # Coordinates from Google Maps (Approx)
    {"name": "Melakottaiyur", "lat": 12.8615, "lng": 80.1485},  # Coordinates from Google Maps (Approx)
    {"name": "Nallambakkam", "lat": 12.8712, "lng": 80.1650}    # Coordinates from Google Maps (Approx)
]

TOTAL_BINS = 43
COUNTS = {
    "Full": 27,
    "Half Full": 9,
    "Empty": 7
}

# Image URLs (Using standard placeholders from existing data)
IMAGE_URL = "https://images.unsplash.com/photo-1532996122724-e3c354a0b15b?auto=format&fit=crop&w=800&q=80"
ASSIGNED_DRIVER = "DRV001"
LAST_PICKUP = "2023-10-27T08:30:00Z"

# Helper to generate random offset coordinates (approx 100-500m radius)
def get_random_coords(base_lat, base_lng):
    # 0.001 deg is approx 111m
    lat_offset = random.uniform(-0.005, 0.005)
    lng_offset = random.uniform(-0.005, 0.005)
    return round(base_lat + lat_offset, 6), round(base_lng + lng_offset, 6)

def generate_bins():
    # 1. Create Status Pool
    status_pool = []
    for status, count in COUNTS.items():
        status_pool.extend([status] * count)
    
    if len(status_pool) != TOTAL_BINS:
        print(f"Error: Count mismatch! Generated {len(status_pool)} bins, expected {TOTAL_BINS}")
        return

    random.shuffle(status_pool)

    # 2. Assign Bins to Areas (Round Robin or Random?)
    # User said: "follows kandigai , melakottaiyur,nallambakkam these 3 area with random bin staus with this random area of 3 araes"
    # Interpretation: Randomly distribute the 43 bins across these 3 areas.
    
    bins = []
    full_csv_data = []

    for i in range(1, TOTAL_BINS + 1):
        # Pick Random Area
        area_info = random.choice(AREAS)
        
        # Pick Status
        status = status_pool.pop()
        
        # Generate ID (WCP_XX)
        bin_id = f"WCP_{i:02d}"
        
        # Generate Coords
        lat, lng = get_random_coords(area_info['lat'], area_info['lng'])
        
        bin_data = {
            "id": bin_id,
            "areaName": "West Chengalpattu",
            "locationName": area_info['name'],
            "streetName": f"{area_info['name']} Main Road {random.randint(1, 10)}",
            "coordinates": {
                "lat": lat,
                "lng": lng
            },
            "status": status,
            "imageUrl": IMAGE_URL,
            "assignedDriverId": ASSIGNED_DRIVER,
            "lastPickupTime": LAST_PICKUP,
            "fillLevel": 100 if status == "Full" else (50 if status == "Half Full" else 0)
        }
        
        bins.append(bin_data)
        full_csv_data.append([bin_id, "West Chengalpattu", area_info['name'], lat, lng, status])

    # 3. Output TypeScript File
    ts_content = f"""import {{ Bin }} from '../types';

export const WEST_CHENGALPATTU_BINS: Bin[] = {json.dumps(bins, indent=2)};
"""
    # Fix keys to be unquoted for TS prettiness (optional, but good for style)
    # Actually JSON is valid JS/TS object, so it's fine.

    with open(r'c:\ujjwal\constants\westChengalpattuBins.ts', 'w') as f:
        f.write(ts_content)

    # 4. Output CSV File
    with open(r'c:\ujjwal\west_chengalpattu_distribution.csv', 'w', newline='') as f:
        writer = csv.writer(f)
        writer.writerow(['ID', 'Area', 'Location', 'Latitude', 'Longitude', 'Status'])
        writer.writerows(full_csv_data)

    print(f"Successfully generated {len(bins)} bins in westChengalpattuBins.ts and west_chengalpattu_distribution.csv")

if __name__ == "__main__":
    generate_bins()
