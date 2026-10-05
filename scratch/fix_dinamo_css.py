with open('src/components/Dinamo/DinamoAgent.module.scss', 'r') as f:
    content = f.read()

# Revert all max-height and overflow-y again
content = content.replace('  max-height: 90vh;\n  overflow-y: auto;\n', '')
content = content.replace('  max-height: 90vh;\n  overflow-y: auto;', '')

import re
content = re.sub(
    r'(\.modal\s*\{[^}]*display:\s*flex;\n\s*flex-direction:\s*column;)',
    r'\1\n  max-height: 90vh;\n  overflow-y: auto;',
    content
)

with open('src/components/Dinamo/DinamoAgent.module.scss', 'w') as f:
    f.write(content)
print("Fixed DinamoAgent.module.scss")
