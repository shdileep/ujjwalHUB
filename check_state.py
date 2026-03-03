import urllib.request
import json

BASE_URL = "https://ujjwal-7a8c8-default-rtdb.firebaseio.com"

def fetch(path):
    url = f"{BASE_URL}/{path}.json"
    req = urllib.request.Request(url)
    try:
        with urllib.request.urlopen(req) as res:
            return json.loads(res.read().decode())
    except Exception as e:
        print(f"Error fetching {path}: {e}")
        return {}

bins = fetch("bins")
if not bins:
    print("NO BINS IN DB!")
else:
    bin_values = list(bins.values())
    print(f"Total Bins in DB: {len(bin_values)}")
    kandigai_bins = [b for b in bin_values if b and b.get("areaName", "").lower() == "kandigai"]
    print(f"Total Kandigai Bins: {len(kandigai_bins)}")
    if kandigai_bins:
        print("Sample Kandigai Bin:", kandigai_bins[0])

users = fetch("users")
if users:
    admins = [u for u in users.values() if u and u.get("role") in ["admin", "superadmin"]]
    print("Admins:")
    for a in admins:
        print(f"- {a.get('email')} | Location: {a.get('location')} | Area: {a.get('area')}")
