
import re

def search_ram():
    file_path = r'c:\ujjwal\constants\chennaiBins.ts'
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            content = f.read()

        with open('ram_search.txt', 'w', encoding='utf-8') as out:
            out.write(f"File Size: {len(content)} bytes\n")
            
            # Exact match for locationName "Ram Nagar"
            # Adjust regex to match the JSON structure "locationName": "Ram Nagar"
            matches = re.findall(r'"locationName":\s*"Ram Nagar"', content, re.IGNORECASE)
            
            out.write(f"Total bins with locationName 'Ram Nagar': {len(matches)}\n")
            
            # Also check for "Ram Nagar" in areaName just in case
            area_matches = re.findall(r'"areaName":\s*"Ram Nagar"', content, re.IGNORECASE)
            out.write(f"Total bins with areaName 'Ram Nagar': {len(area_matches)}\n")
            
    except Exception as e:
        with open('ram_search.txt', 'w') as out:
            out.write(f"Error: {e}")

if __name__ == "__main__":
    search_ram()
