import urllib.request
import json
import re

# Read candidate bins
with open(r"c:\ujjwal\constants\kandigaiData.ts", "r") as f:
    text = f.read()

# find lat lng
coords = re.findall(r"lat:\s*([0-9.]+),\s*lng:\s*([0-9.]+)", text)

print(f"Total bins: {len(coords)}")

coord_str = "80.1,12.8;" + ";".join([f"{c[1]},{c[0]}" for c in coords]) + ";80.12,12.9"

url = f"https://router.project-osrm.org/trip/v1/driving/{coord_str}?roundtrip=false&source=first&destination=last&overview=full&geometries=geojson"

try:
    req = urllib.request.Request(url)
    with urllib.request.urlopen(req) as response:
        data = json.loads(response.read().decode())
        if 'trips' in data:
            print("Trip successful!")
            print("Distance:", data['trips'][0]['distance'] / 1000, "km")
        else:
            print("No trips found")
except Exception as e:
    print("Error:", e)
    
