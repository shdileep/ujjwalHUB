
import csv

def check_coords():
    csv_path = 'c:/ujjwal/adambakkam_bins.csv'
    try:
        with open(csv_path, 'r', encoding='utf-8') as f:
            reader = csv.reader(f)
            
            print("Checking for outliers (Lat > 13.0 or Lng > 80.23)...")
            count = 0
            for i, row in enumerate(reader):
                if len(row) < 9: continue
                try:
                    lat = float(row[7])
                    lng = float(row[8])
                    
                    if lat > 13.0 or lng > 80.23:
                        print(f"Row {i+1}: ID={row[0]} Address='{row[5]}' Lat={lat} Lng={lng}")
                        count += 1
                except ValueError:
                    continue
            
            if count == 0:
                print("No obvious outliers found in the CSV based on simple threshold.")
                # Maybe I should print the range?
                lats = []
                lngs = []
                f.seek(0)
                for row in csv.reader(f):
                    try:
                        lats.append(float(row[7]))
                        lngs.append(float(row[8]))
                    except: pass
                
                if lats:
                    print(f"Lat Range: {min(lats)} - {max(lats)}")
                    print(f"Lng Range: {min(lngs)} - {max(lngs)}")

    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    check_coords()
