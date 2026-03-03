
import os
import re

FILE_PATH = r'c:\ujjwal\components\sections\DriverTasks.tsx'

def force_fix():
    if not os.path.exists(FILE_PATH):
        print(f"File not found: {FILE_PATH}")
        return

    print(f"Reading {FILE_PATH}...")
    with open(FILE_PATH, 'r', encoding='utf-8') as f:
        content = f.read()

    # Define the regex patterns for the bad strings
    # We look for `< svg` with optional spaces, and the attributes with spaces around =
    
    # 1. Fix getDumpYardIconSvg
    # Pattern: return `< svg width = "${size}" ...
    pattern1 = r'return\s*`<(\s*)svg(\s+)width(\s*)=(\s*)"\$\{size\}"'
    replacement1 = 'return `<svg width="${size}"'
    
    print("Applying regex fix for getDumpYardIconSvg...")
    new_content = re.sub(pattern1, replacement1, content)
    
    # Also fix the closing tag </ svg >
    new_content = re.sub(r'</\s*svg\s*>', '</svg>', new_content)
    
    # 2. Fix dumpYardIcon
    # Pattern: html: `< div class=...
    pattern2 = r'html:\s*`<(\s*)div(\s+)class='
    replacement2 = 'html: `<div class='
    
    print("Applying regex fix for dumpYardIcon...")
    new_content = re.sub(pattern2, replacement2, new_content)
    
    # Fix closing div </ div >
    new_content = re.sub(r'</\s*div\s*>', '</div>', new_content)

    # 3. Aggressive cleanup of other attributes if needed (width = " -> width=")
    # Be careful not to break other things, but targeting specific common patterns in this file
    new_content = new_content.replace('width = "', 'width="')
    new_content = new_content.replace('height = "', 'height="')
    new_content = new_content.replace('viewBox = "', 'viewBox="')
    new_content = new_content.replace('xmlns = "', 'xmlns="')

    # Verify if changes happened
    if content == new_content:
        print("WARNING: No changes were made! Regex might have missed.")
    else:
        print("Changes applied in memory.")

    print(f"Writing to {FILE_PATH}...")
    with open(FILE_PATH, 'w', encoding='utf-8') as f:
        f.write(new_content)
        
    print("Done.")

if __name__ == "__main__":
    force_fix()
