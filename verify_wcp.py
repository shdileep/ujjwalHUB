import re

def verify():
    try:
        with open('constants/westChengalpattuBins.ts', 'r', encoding='utf-8') as f:
            content = f.read()
    except Exception as e:
        print(f"Error reading file: {e}")
        return

    mambakkam_count = len(re.findall(r'"locationName": "Mambakkam"', content))
    melakottaiyur_count = len(re.findall(r'"locationName": "Melakottaiyur"', content))
    kandigai_count = len(re.findall(r'"locationName": "Kandigai"', content))
    
    full_count = len(re.findall(r'"status": "Full"', content))
    half_count = len(re.findall(r'"status": "Half Full"', content))
    empty_count = len(re.findall(r'"status": "Empty"', content))
    
    total_bins = len(re.findall(r'"id": "WCP_', content))

    output = []
    output.append(f"Mambakkam: {mambakkam_count}")
    output.append(f"Melakottaiyur: {melakottaiyur_count}")
    output.append(f"Kandigai: {kandigai_count}")
    output.append(f"Total Bins: {total_bins}")
    output.append(f"Full: {full_count}")
    output.append(f"Half: {half_count}")
    output.append(f"Empty: {empty_count}")

    with open('verify_output.txt', 'w') as f:
        f.write('\n'.join(output))

if __name__ == "__main__":
    verify()
