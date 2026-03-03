
import re

def count_new_bins():
    try:
        with open('c:/ujjwal/constants/chennaiBins.ts', 'r', encoding='utf-8') as f:
            content = f.read()
        
        # Regex to find areaName
        area_matches = re.findall(r'"areaName":\s*"([^"]+)"', content)
        
        adambakkam_count = 0
        target_areas = ['ADAMBAKKAM', 'Erukkencherry', 'GANGAI NAGAR']
        
        for area in area_matches:
            if area in target_areas:
                adambakkam_count += 1
            # Also check case-insensitive just in case
            elif area.upper() in ['ADAMBAKKAM', 'ERUKKENCHERRY', 'GANGAI NAGAR']:
                 adambakkam_count += 1

        
        with open('verify_result_utf8.txt', 'w', encoding='utf-8') as out:
            out.write(f"Total Adambakkam Bins in new file: {adambakkam_count}\n")
            
            # Breakdown
            out.write("Breakdown:\n")
            for ta in target_areas:
                c = area_matches.count(ta)
                out.write(f"{ta}: {c}\n")

    except Exception as e:
        with open('verify_result_utf8.txt', 'w', encoding='utf-8') as out:
            out.write(f"Error: {e}\n")

if __name__ == "__main__":
    count_new_bins()
