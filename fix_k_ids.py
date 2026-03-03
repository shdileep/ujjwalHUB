import os

filepath = r"c:\ujjwal\constants\kandigaiData.ts"
with open(filepath, "r", encoding="utf-8") as f:
    content = f.read()

content = content.replace("id: 'K_", "id: '")

with open(filepath, "w", encoding="utf-8") as f:
    f.write(content)
print("Updated kandigaiData.ts successfully.")
