
import os

FILE_PATH = r'c:\ujjwal\components\sections\DriverTasks.tsx'

def check_hidden_chars():
    if not os.path.exists(FILE_PATH):
        print("File not found.")
        return

    with open(FILE_PATH, 'rb') as f:
        content = f.read()
    
    # Check for non-ascii or suspicious bytes
    suspicious = []
    for i, byte in enumerate(content):
        # Allow standard whitespace (space, tab, newline, cr) and printable ascii
        if not (32 <= byte <= 126 or byte in [9, 10, 13]):
            suspicious.append((i, byte))
            
    if suspicious:
        print(f"Found {len(suspicious)} suspicious characters!")
        for i, b in suspicious[:10]:
            print(f"Position {i}: Byte {b} ({hex(b)})")
    else:
        print("No suspicious hidden characters found (Checked ASCII range).")

    # Double check specifically lines 90-100
    try:
        with open(FILE_PATH, 'r', encoding='utf-8') as f:
            lines = f.readlines()
        
        line92 = lines[91] # 0-indexed
        print(f"Line 92 Content: {repr(line92)}")
        
        if '< svg' in line92:
            print("CRITICAL: Found '< svg' with space in Line 92!")
        elif '<svg' in line92:
             print("Line 92 looks correct: '<svg'")
        else:
             print("Line 92 does not contain expected SVG tag.")
             
    except Exception as e:
        print(f"Error reading lines: {e}")

if __name__ == "__main__":
    check_hidden_chars()
