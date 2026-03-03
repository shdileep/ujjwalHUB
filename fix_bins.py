
import re
import json
import os

file_path = 'constants/chennaiBins.ts'

with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

# Extract the array part
start_marker = 'export const CHENNAI_BINS_DATA: Bin[] = '
end_marker = '];'

start_index = content.find(start_marker)
if start_index == -1:
    print("Could not find start marker")
    exit(1)

array_start = start_index + len(start_marker)
array_end = content.rfind(end_marker) + 1

array_str = content[array_start:array_end]

# Cleanup for JSON parsing
# 1. Remove trailing commas
# 2. Quote keys if they aren't quoted (though file view showed they are)
# 3. Comments?
# The file view showed valid JSON format inside the array.
# Let's try to parse it as JSON by replacing the trailing commas.

# Remove trailing comma before '}' and ']'
cleaned_str = re.sub(r',\s*}', '}', array_str)
cleaned_str = re.sub(r',\s*]', ']', cleaned_str)

try:
    data = json.loads(cleaned_str)
except json.JSONDecodeError as e:
    print(f"JSON Parse failed: {e}")
    # Fallback: manual eval using string manip if needed, but let's see.
    exit(1)

print(f"Loaded {len(data)} bins.")

# 1. Separate Adambakkam vs Others
adambakkam_bins = []
other_bins = []

for b in data:
    area = (b.get('areaName') or '').upper()
    loc = (b.get('locationName') or '').upper()
    bid = b.get('id')
    
    # GHOST CHECK: If it's Adyar/Besant AND ID is 01/02, DROP IT.
    if bid in ['01', '02', '1', '2'] and ('ADYAR' in area or 'BESANT' in area or 'ADYAR' in loc or 'BESANT' in loc):
        print(f"👻 DROPPING GHOST: {bid} - {area}")
        continue

    if 'ADAMBAKKAM' in area or 'ADAMBAKKAM' in loc:
        adambakkam_bins.append(b)
    else:
        other_bins.append(b)

print(f"Found {len(adambakkam_bins)} Adambakkam bins. Renumbering...")

# 2. Renumber Adambakkam
for idx, b in enumerate(adambakkam_bins):
    new_id = f"{idx+1:02d}" # 01, 02...
    b['id'] = new_id
    b['areaName'] = 'ADAMBAKKAM'
    if not b.get('locationName'):
        b['locationName'] = 'ADAMBAKKAM'
    if not b.get('streetName'):
        b['streetName'] = 'ADAMBAKKAM STREET'

# 3. Combine (Adambakkam FIRST to ensure they are 01..N)
final_bins = adambakkam_bins + other_bins
print(f"Final Count: {len(final_bins)}")

# 4. Serialize back to TS format
json_str = json.dumps(final_bins, indent=2)

# Reconstruct file
new_content = content[:array_start] + json_str + content[array_end:]

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(new_content)

print("✅ Successfully rewrote chennaiBins.ts")
