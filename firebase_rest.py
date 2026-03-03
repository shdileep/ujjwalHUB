import urllib.request
import json
import uuid

BASE_URL = "https://ujjwal-7a8c8-default-rtdb.firebaseio.com"

def get_data(path):
    url = f"{BASE_URL}/{path}.json"
    req = urllib.request.Request(url)
    try:
        with urllib.request.urlopen(req) as res:
            return json.loads(res.read().decode())
    except:
        return {}

def put_data(path, data):
    url = f"{BASE_URL}/{path}.json"
    req = urllib.request.Request(url, data=json.dumps(data).encode(), method='PUT')
    req.add_header('Content-Type', 'application/json')
    try:
        with urllib.request.urlopen(req) as res:
            return json.loads(res.read().decode())
    except Exception as e:
        print(f"Error putting to {path}: {e}")

def patch_data(path, data):
    url = f"{BASE_URL}/{path}.json"
    req = urllib.request.Request(url, data=json.dumps(data).encode(), method='PATCH')
    req.add_header('Content-Type', 'application/json')
    try:
        with urllib.request.urlopen(req) as res:
            return json.loads(res.read().decode())
    except Exception as e:
        print(f"Error patching {path}: {e}")

print("Checking Firebase via REST...")
drivers = get_data("drivers") or {}

kandigai_id = None
kandigai_name = "Kandigai Express"

# Find existing Kandigai Driver
for key, d in drivers.items():
    if isinstance(d, dict) and (d.get("location") == "Kandigai" or d.get("area") == "Kandigai" or "Kandigai" in str(d.get("username", ""))):
        kandigai_id = key
        kandigai_name = d.get("username", kandigai_name)
        print(f"Found existing Kandigai Driver: {kandigai_id}")
        break

if not kandigai_id:
    kandigai_id = f"EMP-KAND-{str(uuid.uuid4())[:6].upper()}"
    print(f"Creating new Kandigai driver: {kandigai_id}")

driver_data = {
    "driverId": kandigai_id,
    "employeeId": kandigai_id,
    "email": "kandigai.driver@ujjwal.com",
    "phone": "+91 9999900000",
    "username": kandigai_name,
    "status": "online",
    "location": "Kandigai",
    "isProfileComplete": True,
    "role": "driver"
}

hub_data = {
    "driverId": kandigai_id,
    "personnelIdentity": {
        "name": kandigai_name,
        "driverId": kandigai_id,
        "phone": "+91 9999900000",
        "profilePhoto": None
    },
    "accountLifecycle": { "status": "Operational", "color": "green" },
    "availability": { "status": "online" },
    "deployment": { "tasksCompleted": 0 }
}

print("Patching Users...")
patch_data(f"users/{kandigai_id}", driver_data)

print("Patching Drivers...")
patch_data(f"drivers/{kandigai_id}", driver_data)

print("Patching DriversHub...")
patch_data(f"DriversHub/{kandigai_id}", hub_data)

print("✅ Success! Kandigai Driver is synced to Firebase.")
