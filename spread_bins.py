import codecs
import re
import math

path = r"C:\ujjwal\constants\kandigaiData.ts"
content = codecs.open(path, 'r', 'utf-8').read()

lines = content.split('\n')
in_bins = False
idx = 0

for i, line in enumerate(lines):
    if 'KANDIGAI_BINS' in line:
        in_bins = True
    elif in_bins and '];' in line:
        in_bins = False
        
    if in_bins and 'lat:' in line and 'lng:' in line:
        # Extract lat and lng
        match = re.search(r'lat:\s*([0-9.]+),\s*lng:\s*([0-9.]+)', line)
        if match:
            lat = float(match.group(1))
            lng = float(match.group(2))
            
            # 0.0003 degrees is ~33 meters spread
            # Create a golden ratio spiral distribution or just a circle
            angle = idx * 2.39996 # golden angle
            radius = 0.00015 * (math.sqrt(idx) % 2 + 1) # ~16 to 33 meters spread based on index
            
            offset_lat = lat + radius * math.cos(angle)
            offset_lng = lng + radius * math.sin(angle)
            
            new_coords = f"lat: {offset_lat:.6f}, lng: {offset_lng:.6f}"
            lines[i] = line.replace(match.group(0), new_coords)
            
            idx += 1

with codecs.open(path, 'w', 'utf-8') as f:
    f.write('\n'.join(lines))
    
print("Bins spread successfully.")
