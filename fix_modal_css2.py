with open('src/components/Modals/ProjectDetailModal.module.scss', 'r') as f:
    content = f.read()

import re

# We will just insert max-height and overflow-y into .modal using regex
content = re.sub(r'(\.modal\s*\{[^\}]+?)(?=\})', r'\1  max-height: 95vh;\n  overflow-y: auto;\n', content)

with open('src/components/Modals/ProjectDetailModal.module.scss', 'w') as f:
    f.write(content)
