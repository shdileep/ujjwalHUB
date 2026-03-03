
import json

def verify_adambakkam_fix():
    ts_path = 'c:/ujjwal/constants/chennaiBins.ts'
    try:
        with open(ts_path, 'r', encoding='utf-8') as f:
            content = f.read()
            
        import re
        match = re.search(r'export const CHENNAI_BINS_DATA: Bin\[\] = (\[.*\]);', content, re.DOTALL)
        if match:
            json_str = match.group(1)
            json_str = re.sub(r',\s*]', ']', json_str)
            json_str = re.sub(r',\s*}', '}', json_str)
            data = json.loads(json_str)
            
            adambakkam = [b for b in data if b['areaName'] == 'Adambakkam']
            print(f"Total Adambakkam Bins: {len(adambakkam)}")
            
            if adambakkam:
                print("Sample Bin 1:")
                print(f"ID: {adambakkam[0]['id']}")
                print(f"LocationName (Title): {adambakkam[0]['locationName']}")
                print(f"StreetName (Subtitle): {adambakkam[0].get('streetName', 'MISSING')}")
                
                print("Sample Bin Last:")
                print(f"ID: {adambakkam[-1]['id']}")
            
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    verify_adambakkam_fix()
