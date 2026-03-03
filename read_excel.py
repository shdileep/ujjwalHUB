import pandas as pd

try:
    df = pd.read_excel('bin_dataset.xlsx')
    print("Columns:", df.columns.tolist())
    print("\nFirst 5 rows:")
    print(df.head().to_string())
    print("\nShape:", df.shape)
except Exception as e:
    print("Error reading excel:", e)
