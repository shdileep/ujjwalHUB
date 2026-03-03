import urllib.request
import json
import sys

coords = [
    [80.15399, 12.835573],
    [80.144675, 12.855117],
    [80.150373, 12.848659],
    [80.14901, 12.845991],
    [80.147045, 12.851268]
]

coord_str = ";".join([f"{c[0]},{c[1]}" for c in coords])
url = f"https://router.project-osrm.org/trip/v1/driving/{coord_str}?roundtrip=false&source=first&destination=last&overview=full&geometries=geojson"

try:
    req = urllib.request.Request(url)
    with urllib.request.urlopen(req) as response:
        data = json.loads(response.read().decode())
        if 'trips' in data:
            print("Trip successful!")
            print("Distance:", data['trips'][0]['distance'])
            print("Waypoints mapped:", len(data['waypoints']))
            # to get the new order, waypoints have a waypoint_index
            for wp in data['waypoints']:
                print(wp['waypoint_index'], wp['location'])
        else:
            print("No trips found in response")
except Exception as e:
    print("Error:", e)
