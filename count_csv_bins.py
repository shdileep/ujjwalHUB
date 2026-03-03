
import pandas as pd

def count_bins():
    try:
        df = pd.read_csv('c:/ujjwal/chennai_bins_with_status.csv')
        
        with open('csv_counts_utf8.txt', 'w', encoding='utf-8') as f:
            if 'AREA_NAME' not in df.columns:
                f.write("Error: AREA_NAME column not found\n")
                return

            target_areas = ['ADAMBAKKAM', 'ERUKKENCHERRY', 'GANGAI NAGAR']
            
            f.write("--- CSV Bin Counts ---\n")
            total = 0
            for area in target_areas:
                # Case insensitive match
                count = df[df['AREA_NAME'].str.upper().str.strip() == area].shape[0]
                f.write(f"{area}: {count}\n")
                total += count
            
            f.write(f"\nTotal for mapped components: {total}\n")

            # Also check for variations
            f.write("\n--- Checking for partial matches ---\n")
            for area in target_areas:
                matches = df[df['AREA_NAME'].str.upper().str.contains(area, na=False)]['AREA_NAME'].unique()
                f.write(f"Matches for {area}: {matches}\n")

    except Exception as e:
        with open('csv_counts_utf8.txt', 'w', encoding='utf-8') as f:
            f.write(f"Error: {e}\n")

if __name__ == "__main__":
    count_bins()
