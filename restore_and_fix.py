
import os

BACKUP_FILE = r'c:\ujjwal\components\sections\DriverTasks.tsx.bak'
TARGET_FILE = r'c:\ujjwal\components\sections\DriverTasks.tsx'

def restore_and_fix():
    if not os.path.exists(BACKUP_FILE):
        print(f"Backup file not found: {BACKUP_FILE}")
        return

    print(f"Reading backup {BACKUP_FILE}...")
    with open(BACKUP_FILE, 'r', encoding='utf-8') as f:
        content = f.read()

    # Apply fixes
    print("Applying syntax fixes...")
    fixed_content = content.replace('< svg', '<svg')
    fixed_content = fixed_content.replace('< div', '<div')
    fixed_content = fixed_content.replace('width = "', 'width="')
    fixed_content = fixed_content.replace('height = "', 'height="')
    fixed_content = fixed_content.replace('viewBox = "', 'viewBox="')
    fixed_content = fixed_content.replace('xmlns = "', 'xmlns="')
    fixed_content = fixed_content.replace('</ svg >', '</svg>')
    fixed_content = fixed_content.replace('</ div >', '</div>')

    # Remove the debug timestamp if present
    fixed_content = fixed_content.replace('// TEST_WRITE_ACCESS_TIMESTAMP', '')

    print(f"Writing restoration to {TARGET_FILE}...")
    with open(TARGET_FILE, 'w', encoding='utf-8') as f:
        f.write(fixed_content)

    print("Success! File restored and fixed.")

if __name__ == "__main__":
    restore_and_fix()
