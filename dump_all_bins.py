
import json
import re

def dump_all_bins():
    ts_path = 'c:/ujjwal/constants/chennaiBins.ts'
    out_path = 'c:/ujjwal/all_bins_dump.txt'
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

            output.append(f"Total Bins: {len(data)}")
            output.append("ID | Area | Location")
            output.append("-" * 50)
            
            # Sort by Area then ID
            data.sort(key=lambda x: (x.get('areaName', ''), x['id']))
            
            for b in data:
                # specifically look for Adyar
                area = b.get('areaName', 'Unknown')
                if area and 'ADYAR' in area.upper():
                    output.append(f"{b['id']} | {area} | {b.get('locationName')}")
                # And check for low IDs
                elif str(b['id']) in ["01", "02", "1", "2"]:
                    output.append(f"LOW ID MATCH: {b['id']} | {area} | {b.get('locationName')}")

    except Exception as e:
        output.append(f"Error: {e}")

    with open(out_path, 'w', encoding='utf-8') as f:
        f.write('\n'.join(output))

if __name__ == "__main__":
    dump_all_bins()
