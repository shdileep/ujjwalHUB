
import re
import json
from collections import Counter

def analyze_bins():
    # Path to the TS file
    bin_file_path = r'c:\ujjwal\constants\chennaiBins.ts'
    area_file_path = r'c:\ujjwal\constants\areas.ts'

    # Read bins file
    try:
        with open(bin_file_path, 'r', encoding='utf-8') as f:
            content = f.read()
        print(f"Successfully read {len(content)} bytes from {bin_file_path}")
    except Exception as e:
        print(f"Error reading file {bin_file_path}: {e}")
        return

    # Regex to find areaName
    # structure is "areaName": "Tiruvottiyur",
    area_matches = re.findall(r'"areaName":\s*"([^"]+)"', content)
    
    with open('analysis_result.txt', 'w', encoding='utf-8') as out:
        out.write(f"Total bins found: {len(area_matches)}\n")
        
        counts = Counter(area_matches)
        
        out.write("\nBin Counts per Area:\n")
        out.write("-" * 30 + "\n")
        for area, count in counts.most_common():
            out.write(f"{area}: {count}\n")

        # Read areas file to check mapping
        try:
            with open(area_file_path, 'r', encoding='utf-8') as f:
                area_content = f.read()
        except Exception as e:
            out.write(f"\nError reading areas file: {e}\n")
            return
            
        # Extract keys from AREA_COMPONENT_MAPPING
        mapping_keys = re.findall(r'"([^"]+)":\s*\[', area_content)
        
        out.write("\n\nAreas in Mapping (constants/areas.ts):\n")
        out.write(str(mapping_keys) + "\n")
        
        # Check for mismatches
        out.write("\nMismatches (Areas in bins but not in mapping keys):\n")
        for area in counts.keys():
            if area not in mapping_keys:
                out.write(f"- {area} (Count: {counts[area]})\n")

if __name__ == "__main__":
    analyze_bins()
