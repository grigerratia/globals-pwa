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

# Restore padding: 1rem;
patch_file('src/components/Modals/ProjectDetailModal.module.scss', [
    ('  /* padding removed per user request */', '  padding: 1rem;')
])

patch_file('src/components/Modals/Modals.module.scss', [
    ('  /* padding removed per user request */', '  padding: 1rem;')
])

patch_file('src/components/Modals/CanceladosModal.module.scss', [
    ('  /* padding removed per user request */', '  padding: 1rem;')
])

# Fix Dinamo Agent avatar squishing
with open('src/components/Dinamo/DinamoAgent.module.scss', 'r') as f:
    content = f.read()

if 'flex-shrink: 0;' not in content.split('.avatar {')[1].split('}')[0]:
    content = content.replace('.avatar {\n    width: 64px;\n    height: 64px;', '.avatar {\n    width: 64px;\n    height: 64px;\n    flex-shrink: 0;')
    with open('src/components/Dinamo/DinamoAgent.module.scss', 'w') as f:
        f.write(content)
    print("Patched DinamoAgent.module.scss avatar")

