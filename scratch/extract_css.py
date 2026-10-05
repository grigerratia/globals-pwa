import re

with open('src/components/KanbanBoard/KanbanBoard.module.scss', 'r') as f:
    lines = f.readlines()

output = ""

def extract_block(lines, start_str):
    block = ""
    in_block = False
    brace_count = 0
    for line in lines:
        if not in_block:
            if start_str in line:
                in_block = True
                block += line
                brace_count += line.count('{') - line.count('}')
        else:
            block += line
            brace_count += line.count('{') - line.count('}')
            if brace_count == 0:
                break
    return block

output += extract_block(lines, ".topHeader {") + "\n\n"
output += extract_block(lines, ".hideOnMobile {") + "\n\n"
output += extract_block(lines, ".desktopOnlyActions {") + "\n\n"
output += extract_block(lines, ".mobileMenuBtn {") + "\n\n"
output += extract_block(lines, ".mobileDropdown {") + "\n\n"

# .mobileDivider wasn't there, let's create it
output += """.mobileDivider {
  height: 1px;
  background-color: #e2e8f0;
  margin: 0.5rem 0;
}\n"""

with open('src/components/TopHeader/TopHeader.module.scss', 'w') as f:
    f.write(output)

