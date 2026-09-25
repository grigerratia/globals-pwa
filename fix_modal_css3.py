import re

with open('src/components/Modals/ProjectDetailModal.module.scss', 'r') as f:
    lines = f.readlines()

new_lines = []
in_modal = False
for line in lines:
    if line.startswith('.modal {'):
        in_modal = True
        new_lines.append(line)
        continue
        
    if in_modal:
        if line.strip() == '}':
            in_modal = False
            new_lines.append("  max-height: 95vh;\n")
            new_lines.append("  overflow-y: auto;\n")
            new_lines.append("}\n")
        elif "max-height: 95vh;" in line or "overflow-y: auto;" in line:
            pass # remove the bad ones
        else:
            new_lines.append(line)
    else:
        new_lines.append(line)

with open('src/components/Modals/ProjectDetailModal.module.scss', 'w') as f:
    f.writelines(new_lines)

