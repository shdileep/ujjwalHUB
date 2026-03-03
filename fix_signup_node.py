import urllib.request
import json

BASE_URL = "https://ujjwal-7a8c8-default-rtdb.firebaseio.com"

def get_data(path):
    url = f"{BASE_URL}/{path}.json"
    req = urllib.request.Request(url)
    try:
        with urllib.request.urlopen(req) as res:
            return json.loads(res.read().decode())
    except Exception as e:
        print(f"Error getting {path}: {e}")
        return {}

def patch_data(path, data):
    url = f"{BASE_URL}/{path}.json"
    req = urllib.request.Request(url, data=json.dumps(data).encode(), method='PATCH')
    req.add_header('Content-Type', 'application/json')
    try:
        with urllib.request.urlopen(req) as res:
            return json.loads(res.read().decode())
    except Exception as e:
        print(f"Error patching {path}: {e}")

print("Fetching drivers...")
drivers = get_data("drivers") or {}
signup_updates = {}

for id, data in drivers.items():
    if isinstance(data, dict):
        signup_updates[id] = {
            "username": data.get("username", "Unknown"),
            "email": data.get("email", ""),
            "phone num": data.get("phone", ""),
            "selected area": data.get("location", "Kandigai"),
            "password": data.get("password", "temp_pass"),
            "driverId": data.get("driverId", id)
        }

print(f"Adding {len(signup_updates)} drivers to signup node...")
patch_data("signup", signup_updates)
print("Done!")
