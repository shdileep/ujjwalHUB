
import json
import re

def dump_all_adambakkam():
    ts_path = 'c:/ujjwal/constants/chennaiBins.ts'
    out_path = 'c:/ujjwal/full_coord_dump.txt'
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
            output.append(f"Total Adambakkam Bins: {len(adambakkam)}")
            output.append("ID | Lat | Lng | Street")
            output.append("-" * 50)
            
            # Sort by ID
            adambakkam.sort(key=lambda x: x['id'])
            
            for b in adambakkam:
                output.append(f"{b['id']} | {b['coordinates']['lat']} | {b['coordinates']['lng']} | {b.get('streetName')}")

    except Exception as e:
        output.append(f"Error: {e}")

    with open(out_path, 'w', encoding='utf-8') as f:
        f.write('\n'.join(output))

if __name__ == "__main__":
    dump_all_adambakkam()
