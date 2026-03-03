import pandas as pd
import json
import sys

try:
    df = pd.read_excel('bin_dataset.xlsx')
    # Handle NaN values
    df = df.where(pd.notnull(df), None)
    data = df.to_dict(orient='records')
    with open('dataset_dump.json', 'w') as f:
        json.dump(data, f, indent=2)
    print("Dump successful")
except Exception as e:
    with open('dataset_error.txt', 'w') as f:
        f.write(str(e))
    print(f"Error: {e}")
