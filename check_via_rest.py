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
        return None

users = get_data("users")
if users:
    for uid, data in users.items():
        if isinstance(data, dict):
            # Check if it has any of these weird keys
            if "phone num" in data or "selected area" in data:
                print(f"Found weird keys in users/{uid}: {json.dumps(data, indent=2)}")
            elif "email" in data and "username" in data:
                pass # Normal user
        
    print("\nLooking for UHD94797 in users...")
    if "UHD94797" in users:
        print(json.dumps(users["UHD94797"], indent=2))
        
drivers = get_data("drivers")
if drivers:
    if "UHD94797" in drivers:
        print("\nUHD94797 in drivers:")
        print(json.dumps(drivers["UHD94797"], indent=2))
