with open('src/components/Modals/ProjectDetailModal.jsx', 'r') as f:
    content = f.read()

old_fin = "const canViewFinances = userRole === 'Administración' || userRole === 'Administrador' || (userRole === 'Líder Comercial' || userRole === 'Líder de Operaciones');"
new_fin = "const canViewFinances = userRole === 'Administración' || userRole === 'Administrador' || userRole === 'Líder Comercial';"
content = content.replace(old_fin, new_fin)

with open('src/components/Modals/ProjectDetailModal.jsx', 'w') as f:
    f.write(content)
