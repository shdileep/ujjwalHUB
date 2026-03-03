
import json
import re

def audit_bins():
    ts_path = 'c:/ujjwal/constants/chennaiBins.ts'
    out_path = 'c:/ujjwal/audit_result.txt'
    
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
            output.append(f"Total Adambakkam Bins in File: {len(adambakkam)}")
            
            if adambakkam:
                ids = [b['id'] for b in adambakkam]
                output.append(f"First ID: {ids[0]}")
                output.append(f"Last ID: {ids[-1]}")
                
                # Check for duplicates in Adambakkam
                seen = set()
                dupes = [x for x in ids if x in seen or seen.add(x)]
                if dupes:
                    output.append(f"Duplicate IDs in Adambakkam: {dupes}")
                else:
                    output.append("No duplicates within Adambakkam set.")

                # Check if any Adambakkam ID exists in NON-Adambakkam bins
                other_bins = [b for b in data if b.get('areaName') != 'Adambakkam']
                other_ids = set(b['id'] for b in other_bins)
                
                conflicts = [i for i in ids if i in other_ids]
                if conflicts:
                    output.append(f"CONFLICT: IDs found in other areas: {conflicts}")
                    for i in conflicts:
                        conflict_bin = next(b for b in other_bins if b['id'] == i)
                        output.append(f"  ID {i} also used in {conflict_bin.get('areaName', 'Unknown')} ({conflict_bin.get('locationName')})")
                else:
                    output.append("No ID conflicts with other areas.")

                # Check for gaps in 01..43
                int_ids = []
                for i in ids:
                    try:
                        int_ids.append(int(i))
                    except:
                        pass
                
                int_ids.sort()
                output.append(f"Found {len(int_ids)} integer IDs.")
                if int_ids:
                    expected = list(range(1, 44)) # 1 to 43
                    missing = [x for x in expected if x not in int_ids]
                    if missing:
                        output.append(f"MISSING IDs in sequence 1-43: {missing}")
                    else:
                        output.append("Sequence 1-43 is complete.")
            else:
                output.append("No Adambakkam bins found.")

    except Exception as e:
        output.append(f"Error: {e}")

    with open(out_path, 'w', encoding='utf-8') as f:
        f.write('\n'.join(output))

if __name__ == "__main__":
    audit_bins()
