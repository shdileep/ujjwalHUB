
import os
import sys

TARGET_FILE = r'c:\ujjwal\components\sections\DriverTasks.tsx'

FIXED_BLOCK = """// Custom Unique Recycle Icon for Dump Yard
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

def run():
    print(f"Reading {TARGET_FILE}...")
    with open(TARGET_FILE, 'r', encoding='utf-8') as f:
        lines = f.readlines()

    # Index 89 corresponds to line 90 in editor (1-based)
    start_idx = 89
    # Index 131 corresponds to line 132. We want to replace UP TO line 131 (index 130).
    # So we replace lines[89:131]
    # Let's verify start content
    print(f"Line 90 content (index 89): {lines[start_idx].strip()}")
    print(f"Line 131 content (index 130): {lines[130].strip()}")
    
    if "Custom Unique" not in lines[start_idx] and "getDumpYard" not in lines[start_idx+1]:
        print("SAFETY CHECK FAILED: Start line content mismatch.")
        return
        
    if "});" not in lines[130]:
        print("SAFETY CHECK FAILED: End line content mismatch.")
        # Try finding it nearby?
        # No, let's just abort to be safe and print actual content
        print(f"Actual line 131: {lines[130]}")
        return

    print("Safety checks passed. Performing replacement...")
    
    new_lines = lines[:start_idx] + [FIXED_BLOCK + '\n'] + lines[131:]
    
    with open(TARGET_FILE, 'w', encoding='utf-8') as f:
        f.writelines(new_lines)
    
    print("SUCCESS: File rewritten.")

if __name__ == "__main__":
    run()
