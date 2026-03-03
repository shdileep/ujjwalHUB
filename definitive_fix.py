
import os
import sys

TARGET_FILE = r'c:\ujjwal\components\sections\DriverTasks.tsx'

# The clean block we want
CLEAN_BLOCK = """// Custom Unique Recycle Icon for Dump Yard
const getDumpYardIconSvg = (size: number = 48) => {
  return `<svg width="${size}" height="${size}" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="grad1" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style="stop-color:#0f172a;stop-opacity:1" />
          <stop offset="100%" style="stop-color:#1e293b;stop-opacity:1" />
        </linearGradient>
        <filter id="shadow_dump">
          <feDropShadow dx="0" dy="4" stdDeviation="4" flood-opacity="0.5"/>
        </filter>
      </defs>
      
      <!-- Main Container with Shadow -->
      <rect x="10" y="10" width="80" height="80" rx="20" fill="url(#grad1)" filter="url(#shadow_dump)" stroke="white" stroke-width="2"/>
      
      <!-- Recycle Logo -->
      <g transform="translate(50, 50) scale(1.8) translate(-12, -12)">
        <path d="M 12 2 L 15 8 L 9 8 Z M 16 8 L 22 19 L 19 19 L 14 9 Z M 8 8 L 13 19 L 10 19 L 2 19 L 5 13 Z M 10 20 L 14 20 L 12 24 Z" fill="#4ade80" stroke="none" /> 
        <path d="M12 3 L14 7 H10 M15.5 8 L20 18 H17 L13 9 M8.5 8 L4 18 H7 L11 9 M11 19 L13 19 L12 21" stroke="#4ade80" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
        <path d="M8 8 L4 16 M16 8 L20 16 M12 20 L12 23" stroke="#22c55e" stroke-width="2" stroke-linecap="round"/>
      </g>
    </svg>`;
};

const dumpYardIcon = new L.DivIcon({
  className: 'dump-yard-marker',
  html: `<div class="hover:scale-110 transition-transform duration-300">
           <svg width="64" height="64" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
             <circle cx="12" cy="12" r="10" fill="#0f172a" stroke="#4ade80" stroke-width="2"/>
             <path d="M7 12l5 5L22 7M2 12l5 5m5-5l5-5" stroke="#4ade80" stroke-width="0" />
             <path d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z" fill="#111827" stroke="white" stroke-width="2"/>
             <path d="M16 10H14V7H10V10H8L12 14L16 10ZM8 14H10V17H14V14H16L12 10L8 14Z" fill="#4ade80"/>
             <path d="M16.5 9C16.5 9 15.5 5 12 5C8.5 5 7.5 9 7.5 9" stroke="#4ade80" stroke-width="1.5" stroke-linecap="round"/>
             <path d="M7.5 15C7.5 15 8.5 19 12 19C15.5 19 16.5 15 16.5 15" stroke="#4ade80" stroke-width="1.5" stroke-linecap="round"/>
             <path d="M5 12H3M21 12H19" stroke="#4ade80" stroke-width="2" stroke-linecap="round"/>
           </svg>
         </div>`,
  iconSize: [64, 64],
  iconAnchor: [32, 64],
  popupAnchor: [0, -64]
});"""

def fix_file():
    print(f"Reading {TARGET_FILE}...")
    try:
        with open(TARGET_FILE, 'r', encoding='utf-8') as f:
            content = f.read()
    except Exception as e:
        print(f"Error reading file: {e}")
        return

    # Check for the bad string
    bad_string_part = '< svg width ='
    
    if bad_string_part not in content:
        print(f"Target string '{bad_string_part}' NOT FOUND. File might already be fixed or regex mismatch.")
        # Print the area where we expect it to be
        start_marker = "// Custom Unique Recycle Icon for Dump Yard"
        idx = content.find(start_marker)
        if idx != -1:
            print(f"Found content around marker:\n{content[idx:idx+200]}...")
        else:
            print("Start marker not found either.")
        return

    print("Found malformed SVG tag! Proceeding with replacement.")

    # Find start and end indices
    start_marker = "// Custom Unique Recycle Icon for Dump Yard"
    start_idx = content.find(start_marker)
    
    if start_idx == -1:
        print("Could not find start marker for replacement.")
        return

    # Find the end of the dumpYardIcon block
    end_marker = "popupAnchor: [0, -64]\n});"
    # Note: Whitespace might vary, let's look for just "popupAnchor: [0, -64]" and then the next "});"
    end_anchor_idx = content.find("popupAnchor: [0, -64]", start_idx)
    
    if end_anchor_idx == -1:
        print("Could not find end marker (popupAnchor).")
        return
        
    # Find the closing "});" after that
    end_idx = content.find("});", end_anchor_idx) + 3
    
    if end_idx == -1:
        print("Could not find closing brackets '});'")
        return

    print(f"Replacing block from index {start_idx} to {end_idx}...")
    
    new_content = content[:start_idx] + CLEAN_BLOCK + content[end_idx:]
    
    try:
        with open(TARGET_FILE, 'w', encoding='utf-8') as f:
            f.write(new_content)
        print("Successfully wrote fixed content to file.")
    except Exception as e:
        print(f"Error writing file: {e}")

if __name__ == "__main__":
    fix_file()
