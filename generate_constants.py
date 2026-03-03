
import pandas as pd
import json
import re

def clean_string(s):
    if pd.isna(s):
        return ""
    return str(s).strip()

def generate_constants():
    # 1. Process Areas
    print("Processing Areas...")
    chennai_areas = pd.read_excel('c:/ujjwal/chennai_ujjwal_areas_summary.xlsx')
    chengalpattu_areas = pd.read_excel('c:/ujjwal/chengalpattu_ujjwal_areas_summary.xlsx')

    all_areas = []
    area_mapping = {}

    def process_area_df(df):
        for _, row in df.iterrows():
            main_area = clean_string(row['Ujjwal Area Name'])
            if not main_area:
                continue
            
            # Extract sub-areas
            # Assuming comma separated, but might have newlines or other delimiters
            raw_components = clean_string(row['Component Areas'])
            # Split by comma, strip whitespace
            components = [c.strip() for c in raw_components.split(',') if c.strip()]
            
            all_areas.append(main_area)
            area_mapping[main_area] = components

    process_area_df(chennai_areas)
    process_area_df(chengalpattu_areas)

    # Sort areas alphabetically
    all_areas.sort()

    # Generate areas.ts content
    areas_ts_content = f"""
export const CHENNAI_AREAS = {json.dumps(all_areas, indent=4)};

export const AREA_COMPONENT_MAPPING: Record<string, string[]> = {json.dumps(area_mapping, indent=4)};
"""

    with open('c:/ujjwal/constants/new_areas.ts', 'w', encoding='utf-8') as f:
        f.write(areas_ts_content)
    print("Generated new_areas.ts")


    # 2. Process Bins
    print("Processing Bins...")
    chennai_bins = pd.read_csv('c:/ujjwal/chennai_bins_with_status.csv')
    chengalpattu_bins = pd.read_csv('c:/ujjwal/chengalpattu_bins_restructured.csv')

    all_bin_data = []

    def process_bin_df(df, prefix):
        for idx, row in df.iterrows():
            # Use OBJECTID or index for ID if BIN_NO is missing or duplicate risk?
            # User wants "exact bins".
            bin_id = clean_string(row.get('BIN_NO', ''))
            if not bin_id:
                bin_id = f"{prefix}_{idx+1:03d}"
            
            bin_obj = {
                "id": bin_id,
                "locationName": clean_string(row.get('LOC_NAME', '')),
                "areaName": clean_string(row.get('AREA_NAME', '')), # Critical for mapping
                "streetName": clean_string(row.get('STREET_NAM', '')),
                "coordinates": {
                    "lat": float(row.get('LATITUDE', 0)),
                    "lng": float(row.get('LONGTITUDE', 0)) # Note spelling in CSV: LONGTITUDE
                },
                "status": clean_string(row.get('BIN_STATUS', 'Empty'))
            }
            all_bin_data.append(bin_obj)

    process_bin_df(chennai_bins, "CHN")
    process_bin_df(chengalpattu_bins, "CGL")

    # Generate chennaiBins.ts content
    # We need to write it as a TS file with imports
    bins_ts_content = f"""
import {{ Bin }} from '../types';

export const CHENNAI_BINS_DATA: Bin[] = {json.dumps(all_bin_data, indent=2)};
"""

    with open('c:/ujjwal/constants/new_chennaiBins.ts', 'w', encoding='utf-8') as f:
        f.write(bins_ts_content)
    print(f"Generated new_chennaiBins.ts with {len(all_bin_data)} bins")

if __name__ == "__main__":
    try:
        generate_constants()
    except Exception as e:
        print(f"Error: {e}")
