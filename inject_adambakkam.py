
import csv
import json
import re

def inject_adambakkam_data():
    csv_path = 'c:/ujjwal/adambakkam_bins.csv'
    ts_path = 'c:/ujjwal/constants/chennaiBins.ts'
    
    new_bins = []
    
    # 1. Read adambakkam_bins.csv
    print(f"Reading {csv_path}...")
    try:
        with open(csv_path, 'r', encoding='utf-8') as f:
            reader = csv.reader(f)
            # Sample row: 8403,N12,N161,ADAMBAKKAM,ADAMBAKKAM,OFFICERS COLONY MIDDLE STREET,S_W161_001,12.9948,80.205007,80.2050069,12.9948002,Full
            # We need to map this to Bin interface:
            # { id, areaName, locationName, address, coordinates: {lat, lng}, status, fillLevel, lastCollection }
            
            for row in reader:
                if len(row) < 12: continue
                # Skip header if it exists (checking validity of float)
                try:
                    lat = float(row[7])
                except:
                    continue
                
                # Renumbering Logic: 01, 02, etc. (based on row order)
                # We need to maintain a counter. Since we are in a loop, we can use an external counter
                # But `reader` is an iterator. We can enumerate.
                # However, we are filtering valid rows inside the loop.
                # Let's adjust the loop to append tuple first, then process?
                # Or just use `len(new_bins) + 1` for ID.
                
                next_id = f"{len(new_bins) + 1:02d}"
                
                bin_id = next_id # "01", "02"...
                
                # Mapping for Display:
                # Title (locationName) -> "ADAMBAKKAM"
                # Subtitle (streetName) -> Full Address ("OFFICERS COLONY...")
                
                area_name = "Adambakkam" 
                location_name = "ADAMBAKKAM"
                street_name = row[5].strip() # Address/Street
                
                lat = float(row[7])
                lng = float(row[8])
                status = row[11].strip()
                
                # Map status to allowed values
                if status not in ['Full', 'Half Full', 'Empty', 'Completed']:
                    status = 'Full'
                
                fill_level = 100 if status == 'Full' else (50 if status == 'Half Full' else 0)
                
                new_bin = {
                    "id": bin_id,
                    "areaName": area_name,
                    "locationName": location_name,
                    "streetName": street_name,
                    "coordinates": {"lat": lat, "lng": lng},
                    "status": status,
                    "fillLevel": fill_level,
                    "lastCollection": "2023-10-26T10:00:00Z"
                }
                new_bins.append(new_bin)
                
    except Exception as e:
        print(f"Error reading CSV: {e}")
        return

    print(f"Parsed {len(new_bins)} bins from adambakkam_bins.csv")

    # 2. Read chennaiBins.ts
    print(f"Reading {ts_path}...")
    try:
        with open(ts_path, 'r', encoding='utf-8') as f:
            content = f.read()
            
        # Extract JSON part
        # Assuming format: export const CHENNAI_BINS_DATA: Bin[] = [ ... ];
        match = re.search(r'export const CHENNAI_BINS_DATA: Bin\[\] = (\[.*\]);', content, re.DOTALL)
        if not match:
            print("Could not find JSON array in TS file.")
            # Fallback for simpler format
            match = re.search(r'=\s*(\[.*\])', content, re.DOTALL)
        
        if match:
            json_str = match.group(1)
            # Remove trailing commas which JS allows but JSON doesn't (simple regex fix)
            json_str = re.sub(r',\s*]', ']', json_str)
            json_str = re.sub(r',\s*}', '}', json_str)
            
            all_bins = json.loads(json_str)
            print(f"Original total bins: {len(all_bins)}")
            
            # 3. Filter OUT existing Adambakkam bins
            # Identify Adambakkam bins by areaName OR by component names if they exist
            # The CSV analysis showed components: ADAMBAKKAM, Erukkencherry, GANGAI NAGAR
            # We should probably remove anything that looks like Adambakkam to be safe, 
            # OR just strictly 'Adambakkam' if that's what we are inserting.
            # Let's remove 'Adambakkam', 'ADAMBAKKAM', 'Erukkencherry', 'GANGAI NAGAR' to be safe?
            # User said "place them @[adambakkam_bins.csv]".
            # If `adambakkam_bins.csv` covers the WHOLE area, we replace all.
            
            target_areas = ['Adambakkam', 'ADAMBAKKAM', 'Erukkencherry', 'GANGAI NAGAR']
            filtered_bins = [b for b in all_bins if b.get('areaName') not in target_areas and b.get('areaName').upper() not in ['ADAMBAKKAM', 'ERUKKENCHERRY', 'GANGAI NAGAR']]
            
            print(f"Bins after removing Adambakkam: {len(filtered_bins)}")
            
            # 4. Append NEW bins
            final_bins = filtered_bins + new_bins
            print(f"Final total bins: {len(final_bins)}")
            
            # 5. Write back to chennaiBins.ts
            new_content = f"import {{ Bin }} from '../types';\n\nexport const CHENNAI_BINS_DATA: Bin[] = {json.dumps(final_bins, indent=2)};\n"
            
            with open(ts_path, 'w', encoding='utf-8') as f:
                f.write(new_content)
                
            print("Successfully updated chennaiBins.ts")
            
        else:
            print("Regex parse failed.")

    except Exception as e:
        print(f"Error processing TS file: {e}")

if __name__ == "__main__":
    inject_adambakkam_data()
