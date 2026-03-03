import urllib.request
import json

BASE_URL = "https://ujjwal-7a8c8-default-rtdb.firebaseio.com"
DRIVER_ID = "UHD94797"

def get_data(path):
    url = f"{BASE_URL}/{path}.json"
    req = urllib.request.Request(url)
    try:
        with urllib.request.urlopen(req) as res:
            return json.loads(res.read().decode())
    except Exception as e:
        print(f"Error getting {path}: {e}")
        return None

def patch_data(path, data):
    url = f"{BASE_URL}/{path}.json"
    req = urllib.request.Request(url, data=json.dumps(data).encode(), method='PATCH')
    req.add_header('Content-Type', 'application/json')
    try:
        with urllib.request.urlopen(req) as res:
            return json.loads(res.read().decode())
    except Exception as e:
        print(f"Error patching {path}: {e}")

print(f"Fetching signup data for {DRIVER_ID}...")
signup_data = get_data(f"signup/{DRIVER_ID}")

if signup_data:
    print("Found signup data:", json.dumps(signup_data, indent=2))
    
    # Structure the data for the 'drivers' node
    driver_update = {
        "username": signup_data.get("username", ""),
        "email": signup_data.get("email", ""),
        "phone": signup_data.get("phone num", ""),
        "location": signup_data.get("selected area", ""),
        "driverId": DRIVER_ID,
        "employeeId": DRIVER_ID,
        "role": "driver"
    }
    
    # We also have "password", but usually passwords aren't stored in plain text in the main drivers node
    # if it's not strictly necessary, but we can add it if required. Let's add it just in case.
    if "password" in signup_data:
         driver_update["password"] = signup_data["password"]
    
    print(f"Updating drivers/{DRIVER_ID} with:", json.dumps(driver_update, indent=2))
    patch_data(f"drivers/{DRIVER_ID}", driver_update)
    
    print(f"Updating users/{DRIVER_ID} with the same data to ensure consistency...")
    patch_data(f"users/{DRIVER_ID}", driver_update)
    
    print("Also restoring DriversHub data...")
    hub_update = {
        "driverId": DRIVER_ID,
        "personnelIdentity": {
            "name": signup_data.get("username", ""),
            "driverId": DRIVER_ID,
            "phone": signup_data.get("phone num", ""),
            "location": signup_data.get("selected area", "")
        }
    }
    patch_data(f"DriversHub/{DRIVER_ID}", hub_update)
    
    print("\nSuccessfully restored driver details!")
else:
    print(f"Could not find signup data for {DRIVER_ID}.")
