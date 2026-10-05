import os

def patch_file(filepath, replacements):
    if not os.path.exists(filepath):
        print(f"File not found: {filepath}")
        return
    with open(filepath, 'r') as f:
        content = f.read()
    
    for old, new in replacements:
        content = content.replace(old, new)
        
    with open(filepath, 'w') as f:
        f.write(content)
    print(f"Patched {filepath}")

# 1. ProjectDetailModal.module.scss
patch_file('src/components/Modals/ProjectDetailModal.module.scss', [
    ('  padding: 1rem;\n  overflow: hidden;', '  /* padding removed per user request */\n  /* overflow: hidden; removed to allow scrolling if needed */'),
    ('  padding: 1rem;\n', '  /* padding removed per user request */\n') # Just in case
])

# 2. Modals.module.scss
patch_file('src/components/Modals/Modals.module.scss', [
    ('  padding: 1rem;\n', '  /* padding removed per user request */\n')
])

# 3. CanceladosModal.module.scss
patch_file('src/components/Modals/CanceladosModal.module.scss', [
    ('  padding: 1rem;\n', '  /* padding removed per user request */\n')
])

# 4. DinamoAgent.module.scss
# Add max-height and overflow-y to .modal
with open('src/components/Dinamo/DinamoAgent.module.scss', 'r') as f:
    content = f.read()
if 'overflow-y: auto;' not in content:
    content = content.replace(
        '  display: flex;\n  flex-direction: column;',
        '  display: flex;\n  flex-direction: column;\n  max-height: 90vh;\n  overflow-y: auto;'
    )
    with open('src/components/Dinamo/DinamoAgent.module.scss', 'w') as f:
        f.write(content)
    print("Patched DinamoAgent.module.scss")
