
import pandas as pd
import json

file1 = 'c:/ujjwal/chengalpattu_ujjwal_areas_summary.xlsx'
file2 = 'c:/ujjwal/chennai_ujjwal_areas_summary.xlsx'

areas = []

try:
    df1 = pd.read_excel(file1)
    # Print columns to debug if needed
    # print(df1.columns)
    # Assuming the first column or a column named 'Area' contains the data. I'll take all unique values from the first column for now.
    if not df1.empty:
      areas.extend(df1.iloc[:, 0].dropna().unique().tolist()) # Taking first column as area names

    df2 = pd.read_excel(file2)
    if not df2.empty:
      areas.extend(df2.iloc[:, 0].dropna().unique().tolist()) # Taking first column as area names

    # Remove duplicates and sort
    unique_areas = sorted(list(set(areas)))
    
    print(json.dumps(unique_areas))

except Exception as e:
    print(f"Error: {e}")
