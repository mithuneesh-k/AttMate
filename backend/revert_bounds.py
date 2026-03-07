import os
import glob

directory = r"c:\AttMate\frontend\screens"
screens_modified = 0

for file_path in glob.glob(os.path.join(directory, "*.js")):
    with open(file_path, "r", encoding="utf-8") as f:
        content = f.read()
    
    if "// Critical for preventing web jitter:" in content:
        lines = content.split('\n')
        new_lines = []
        i = 0
        while i < len(lines):
            line = lines[i]
            if "// Critical for preventing web jitter:" in line:
                # skip this line and the next two lines
                i += 3
                continue
            new_lines.append(line)
            i += 1
            
        with open(file_path, "w", encoding="utf-8") as f:
            f.write('\n'.join(new_lines))
        screens_modified += 1
        print(f"Reverted manual bounds in: {os.path.basename(file_path)}")

print(f"Total screens reverted: {screens_modified}")
