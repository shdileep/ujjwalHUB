
import pandas as pd
import json

def analyze_and_merge():
    with open('analysis_output.txt', 'w', encoding='utf-8') as f:
        try:
            # Load Files
            chennai_areas = pd.read_excel('c:/ujjwal/chennai_ujjwal_areas_summary.xlsx')
            chengalpattu_areas = pd.read_excel('c:/ujjwal/chengalpattu_ujjwal_areas_summary.xlsx')
            chennai_bins = pd.read_csv('c:/ujjwal/chennai_bins_with_status.csv')
            chengalpattu_bins = pd.read_csv('c:/ujjwal/chengalpattu_bins_restructured.csv')

            f.write("\n--- Chennai Areas Columns ---\n")
            f.write(str(chennai_areas.columns.tolist()) + "\n")
            f.write("\n--- Chengalpattu Areas Columns ---\n")
            f.write(str(chengalpattu_areas.columns.tolist()) + "\n")
            
            f.write("\n--- Chennai Bins Sample ---\n")
            f.write(str(chennai_bins.head(2).to_dict('records')) + "\n")
            f.write("\n--- Chengalpattu Bins Sample ---\n")
            f.write(str(chengalpattu_bins.head(2).to_dict('records')) + "\n")

            # Helper to process areas
            def process_areas(df, source_name):
                f.write(f"\n--- Processing {source_name} ---\n")
                f.write(str(df.iloc[0]) + "\n")

            process_areas(chennai_areas, "Chennai Areas")
            process_areas(chengalpattu_areas, "Chengalpattu Areas")

        except Exception as e:
            f.write(f"Error: {e}\n")

if __name__ == "__main__":
    analyze_and_merge()
