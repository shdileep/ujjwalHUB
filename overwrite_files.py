
import shutil
import os

try:
    shutil.copy2('c:/ujjwal/constants/new_chennaiBins.ts', 'c:/ujjwal/constants/chennaiBins.ts')
    print("Overwrote chennaiBins.ts")
    shutil.copy2('c:/ujjwal/constants/new_areas.ts', 'c:/ujjwal/constants/areas.ts')
    print("Overwrote areas.ts")
except Exception as e:
    print(f"Error: {e}")
