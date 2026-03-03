
import json
import re

def find_misplaced_bins():
    ts_path = 'c:/ujjwal/constants/chennaiBins.ts'
    out_path = 'c:/ujjwal/misplaced_debug.txt'
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

            # Filter Adambakkam
            adambakkam = [b for b in data if b.get('areaName') == 'Adambakkam']
            output.append(f"Total Adambakkam Bins in State: {len(adambakkam)}")
            
            misplaced = []
            for b in adambakkam:
                lat = b['coordinates']['lat']
                lng = b['coordinates']['lng']
                
            # Find bins with specific IDs globally to check for collisions
            target_ids = ["01", "02", "1", "2"]
            collisions = [b for b in data if str(b['id']) in target_ids]
            
            if collisions:
                output.append(f"\nFOUND {len(collisions)} BINS WITH ID 01/02:")
                for b in collisions:
                    output.append(f"ID: {b['id']}")
                    output.append(f"  Area: {b.get('areaName')}")
                    output.append(f"  Location: {b.get('locationName')}")
                    output.append(f"  Coords: {b['coordinates']['lat']}, {b['coordinates']['lng']}")
            else:
                output.append("\nNo bins found with ID 01 or 02 globally.")

    except Exception as e:
        output.append(f"Error: {e}")

    with open(out_path, 'w', encoding='utf-8') as f:
        f.write('\n'.join(output))

if __name__ == "__main__":
    find_misplaced_bins()
