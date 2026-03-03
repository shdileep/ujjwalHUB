import re
import json

def debug_adambakkam():
    bin_file_path = r'c:\ujjwal\constants\chennaiBins.ts'
    
    try:
        with open(bin_file_path, 'r', encoding='utf-8') as f:
            content = f.read()
    except Exception as e:
        print(f"Error reading file: {e}")
        return

    # Extract all bin objects
    # We need to capture ID and AreaName
    # structure: { id: "...", ... areaName: "...", ... }
    # This regex is a bit fragile but should work for the generated format
    
    # Let's find all blocks first? No, specific regex for ID and Area in same block is tricky without a parser.
    # But since it's a TS file with one object per line or well-formatted, we can iterate.
    
    # Actually, `chennaiBins.ts` is likely `export const CHENNAI_BINS_DATA: Bin[] = [ ... ];`
    # We can try to strip the JS parts and parse as JSON if it's strictly JSON-like.
    
    json_str = content.split(' = ', 1)[1].strip()
    if json_str.endswith(';'):
        json_str = json_str[:-1]
    
    # TS might have unquoted keys? The generator uses JSON.stringify, so keys should be quoted.
    # But keys in the generator output: `export const CHENNAI_BINS_DATA: Bin[] = ${JSON.stringify(bins, null, 2)};`
    # So it IS valid JSON!
    
    try:
        data = json.loads(json_str)
        print(f"Successfully parsed {len(data)} bins from TS file.")
        
        adambakkam_bins = [b for b in data if b.get('areaName') == 'Adambakkam']
        print(f"Adambakkam Bins in File: {len(adambakkam_bins)}")
        
        ids = [b['id'] for b in adambakkam_bins]
        unique_ids = set(ids)
        print(f"Unique IDs: {len(unique_ids)}")
        
        if len(ids) != len(unique_ids):
            print("DUPLICATE IDS FOUND!")
            # Show duplicates
            seen = set()
            dupes = set()
            for x in ids:
                if x in seen:
                    dupes.add(x)
                seen.add(x)
            print(f"Duplicate IDs: {list(dupes)[:5]} ...")
            
    except Exception as e:
        print(f"JSON Parse Error (might need looser parsing): {e}")

if __name__ == "__main__":
    debug_adambakkam()
