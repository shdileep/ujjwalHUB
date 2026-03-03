import csv
from collections import Counter

def analyze_csv_headless():
    file_path = r'c:\ujjwal\adambakkam_bins.csv'
    print(f"Analyzing {file_path} (Headless Mode)...\n")
    
    statuses = []
    areas = []
    
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            reader = csv.reader(f)
            
            # Based on previous output:
            # ['8403', 'N12', 'N161', 'ADAMBAKKAM', 'ADAMBAKKAM', 'OFFICERS COLONY MIDDLE STREET', 'S_W161_001', '12.9948', '80.205007', '80.2050069', '12.9948002', 'Full']
            # Idx 3: Area (ADAMBAKKAM)
            # Idx 4: Location? (ADAMBAKKAM)
            # Idx 5: Street (OFFICERS COLONY...)
            # Idx 11: Status (Full)
            
            for row in reader:
                if len(row) < 12: continue
                
                # Normalize Status
                raw_status = row[11].strip()
                statuses.append(raw_status)
                
                # Normalize Area
                # Let's check both col 3 and 4
                area = row[3].strip()
                areas.append(area)

        # 1. Status Counts
        print("--- BIN STATUS COUNTS ---")
        status_counts = Counter(statuses)
        for s, c in status_counts.items():
            print(f"{s}: {c}")
            
        # 2. Area Analysis
        print("\n--- AREA ANALYSIS ---")
        unique_areas = set(areas)
        print(f"Total Unique Areas: {len(unique_areas)}")
        
        if len(unique_areas) == 1:
            print(f"All bins are in the same area: {list(unique_areas)[0]}")
        else:
            print("Bins belong to multiple areas:")
            area_counts = Counter(areas)
            for a, c in area_counts.most_common(10):
                print(f"  {a}: {c}")

    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    analyze_csv_headless()
