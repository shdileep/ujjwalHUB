
import json
import re

def simulate_filter():
    # 1. Define Mapping EXACTLY as in areas.ts
    AREA_COMPONENT_MAPPING = {
        "Adambakkam": [
            "ADAMBAKKAM",
            "Erukkencherry",
            "GANGAI NAGAR"
        ]
    }
    
    allowed_components = AREA_COMPONENT_MAPPING["Adambakkam"]
    
    # 2. Read Data
    ts_path = 'c:/ujjwal/constants/chennaiBins.ts'
    out_path = 'c:/ujjwal/filter_debug.txt'
    output = []
    
    try:
        with open(ts_path, 'r', encoding='utf-8') as f:
            content = f.read()

        match = re.search(r'export const CHENNAI_BINS_DATA: Bin\[\] = (\[.*\]);', content, re.DOTALL)
        if not match:
             match = re.search(r'=\s*(\[.*\])', content, re.DOTALL)
        
        if match:
            json_str = match.group(1)
            json_str = re.sub(r',\s*]', ']', json_str)
            json_str = re.sub(r',\s*}', '}', json_str)
            data = json.loads(json_str)

            # 3. Simulate Logic
            # Filter ONLY Adambakkam bins first (to mimic what we expect in the state)
            # Actually, in the app, 'state.bins' technically contains everything, 
            # OR if it was filtered by the import...
            # The debug msg said "Global: 43". 
            # If Global is 43, it means state.bins ONLY has 43 items (the Adambakkam ones).
            # So we iterate over ALL 43.
            
            # BUT wait, if Global is 43, it implies the USER STATE has 43 bins.
            # If the user state has 43 bins, are they ALL Adambakkam bins?
            # Yes, because we deleted everything else or clean slate? 
            # Or maybe we are just looking at the `adambakkamBins` subset?
            # The debug line said: `Global: {state.bins.length}`.
            
            global_bins = [b for b in data if b.get('areaName') == 'Adambakkam']
            output.append(f"Simulating filter on {len(global_bins)} Adambakkam bins...")
            
            passed = []
            failed = []
            
            for b in global_bins:
                area_name = b.get('areaName', '')
                location_name = b.get('locationName', '')
                
                is_match = False
                for c in allowed_components:
                    c_lower = c.lower()
                    if (area_name and c_lower == area_name.lower()) or \
                       (c_lower == location_name.lower()):
                        is_match = True
                        break
                
                if is_match:
                    passed.append(b['id'])
                else:
                    failed.append(b)

            output.append(f"Passed: {len(passed)}")
            output.append(f"Failed: {len(failed)}")
            
            if failed:
                output.append("\nFAILED BINS:")
                for b in failed:
                    output.append(f"ID: {b['id']}")
                    output.append(f"  AreaName: '{b.get('areaName')}'")
                    output.append(f"  LocationName: '{b.get('locationName')}'")
                    output.append(f"  StreetName: '{b.get('streetName')}'")
                    output.append("-" * 20)

    except Exception as e:
        output.append(f"Error: {e}")

    with open(out_path, 'w', encoding='utf-8') as f:
        f.write('\n'.join(output))

if __name__ == "__main__":
    simulate_filter()
