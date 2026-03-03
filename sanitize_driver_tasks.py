
import os

FILE_PATH = r'c:\ujjwal\components\sections\DriverTasks.tsx'

def sanitize():
    if not os.path.exists(FILE_PATH):
        print(f"File not found: {FILE_PATH}")
        return

    print(f"Reading {FILE_PATH}...")
    with open(FILE_PATH, 'r', encoding='utf-8') as f:
        lines = f.readlines()

    new_lines = []
    skip = False
    
    # We will reconstruct the file. 
    # When we hit the start of the bad function, we skip lines until the end of it, 
    # and insert the good version.
    
    iterator = iter(lines)
    for line in iterator:
        # Check for start of getDumpYardIconSvg
        if 'const getDumpYardIconSvg = (size: number = 48) => {' in line:
            print("Found getDumpYardIconSvg. Replacing...")
            # Insert clean version
            new_lines.append('const getDumpYardIconSvg = (size: number = 48) => {\n')
            new_lines.append('  return `<svg width="${size}" height="${size}" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">\n')
            new_lines.append('      <defs>\n')
            new_lines.append('        <linearGradient id="grad1" x1="0%" y1="0%" x2="100%" y2="100%">\n')
            new_lines.append('          <stop offset="0%" style="stop-color:#0f172a;stop-opacity:1" />\n')
            new_lines.append('          <stop offset="100%" style="stop-color:#1e293b;stop-opacity:1" />\n')
            new_lines.append('        </linearGradient>\n')
            new_lines.append('        <filter id="shadow_dump">\n')
            new_lines.append('          <feDropShadow dx="0" dy="4" stdDeviation="4" flood-opacity="0.5"/>\n')
            new_lines.append('        </filter>\n')
            new_lines.append('      </defs>\n')
            new_lines.append('      <rect x="10" y="10" width="80" height="80" rx="20" fill="url(#grad1)" filter="url(#shadow_dump)" stroke="white" stroke-width="2"/>\n')
            new_lines.append('      <g transform="translate(50, 50) scale(1.8) translate(-12, -12)">\n')
            new_lines.append('        <path d="M 12 2 L 15 8 L 9 8 Z M 16 8 L 22 19 L 19 19 L 14 9 Z M 8 8 L 13 19 L 10 19 L 2 19 L 5 13 Z M 10 20 L 14 20 L 12 24 Z" fill="#4ade80" stroke="none" />\n')
            new_lines.append('        <path d="M12 3 L14 7 H10 M15.5 8 L20 18 H17 L13 9 M8.5 8 L4 18 H7 L11 9 M11 19 L13 19 L12 21" stroke="#4ade80" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" fill="none" />\n')
            new_lines.append('        <path d="M8 8 L4 16 M16 8 L20 16 M12 20 L12 23" stroke="#22c55e" stroke-width="2" stroke-linecap="round" />\n')
            new_lines.append('      </g>\n')
            new_lines.append('    </svg>`;\n')
            new_lines.append('};\n')
            
            # Skip until we find the end of the function (Assume it ends with }; and distinct context, or just skip fixed number of lines if safer?
            # Better: skip until we see the start of the next constant or specific line
            # The original file has `const dumpYardIcon = ...` after this.
            
            # Consume lines until we see 'const dumpYardIcon'
            while True:
                try:
                    next_line = next(iterator)
                    if 'const dumpYardIcon =' in next_line:
                        # Found the next block. Process it.
                        print("Found dumpYardIcon. Replacing...")
                        new_lines.append('\n')
                        new_lines.append('const dumpYardIcon = new L.DivIcon({\n')
                        new_lines.append("  className: 'dump-yard-marker',\n")
                        new_lines.append('  html: `<div class="hover:scale-110 transition-transform duration-300">\n')
                        new_lines.append('  <svg width="64" height="64" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">\n')
                        new_lines.append('    <circle cx="12" cy="12" r="10" fill="#0f172a" stroke="#4ade80" stroke-width="2" />\n')
                        new_lines.append('    <path d="M7 12l5 5L22 7M2 12l5 5m5-5l5-5" stroke="#4ade80" stroke-width="0" />\n')
                        new_lines.append('    <path d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z" fill="#111827" stroke="white" stroke-width="2" />\n')
                        new_lines.append('    <path d="M16 10H14V7H10V10H8L12 14L16 10ZM8 14H10V17H14V14H16L12 10L8 14Z" fill="#4ade80" />\n')
                        new_lines.append('    <path d="M16.5 9C16.5 9 15.5 5 12 5C8.5 5 7.5 9 7.5 9" stroke="#4ade80" stroke-width="1.5" stroke-linecap="round" />\n')
                        new_lines.append('    <path d="M7.5 15C7.5 15 8.5 19 12 19C15.5 19 16.5 15 16.5 15" stroke="#4ade80" stroke-width="1.5" stroke-linecap="round" />\n')
                        new_lines.append('    <path d="M5 12H3M21 12H19" stroke="#4ade80" stroke-width="2" stroke-linecap="round" />\n')
                        new_lines.append('  </svg>\n')
                        new_lines.append('         </div>`,\n')
                        new_lines.append('  iconSize: [64, 64],\n')
                        new_lines.append('  iconAnchor: [32, 64],\n')
                        new_lines.append('  popupAnchor: [0, -64]\n')
                        new_lines.append('});\n')
                        
                        # Now convert the iterator to skip the body of dumpYardIcon
                        # ending at });
                        while True:
                            sub_line = next(iterator)
                            if '});' in sub_line and 'iconAnchor' not in sub_line: # End of dumpYardIcon struct
                                break
                        break
                except StopIteration:
                    break
        else:
             # Regular line, just keep it
             # Also strict check to remove the debug timestamp if we missed it
             if 'TEST_WRITE_ACCESS_TIMESTAMP' in line:
                 line = line.replace(' // TEST_WRITE_ACCESS_TIMESTAMP', '')
             new_lines.append(line)

    print(f"Writing sanitized content to {FILE_PATH}...")
    with open(FILE_PATH, 'w', encoding='utf-8') as f:
        f.writelines(new_lines)
    
    print("Done.")

if __name__ == "__main__":
    sanitize()
