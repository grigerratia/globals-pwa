import re

files = [
    "src/components/KanbanBoard/KanbanBoard.jsx",
    "src/services/ai/dinamoService.js"
]

for f in files:
    with open(f, 'r') as file:
        content = file.read()
    
    # Replace the query in KanbanBoard and dinamoService
    content = re.sub(
        r"const\s+\{\s*data:\s*superusers\s*\}\s*=\s*await\s+supabase\.from\('usuarios'\)\.select\('id,\s*nombre,\s*rol'\)\.in\('rol',\s*\['Líder Comercial',\s*'Líder de Operaciones'\]\);",
        r"const { data: _allEmps } = await supabase.rpc('get_empleados');\n    const superusers = (_allEmps || []).filter(e => ['Líder Comercial', 'Líder de Operaciones'].includes(e.rol));",
        content
    )
    
    content = re.sub(
        r"const\s+\{\s*data:\s*uData\s*\}\s*=\s*await\s+supabase\.from\('usuarios'\)\.select\('id,\s*nombre,\s*rol'\)\.ilike\('nombre',\s*`%\$\{args\.nombre_usuario\}%`\)\.limit\(1\);",
        r"const { data: _searchEmps } = await supabase.rpc('get_empleados');\n        const uData = (_searchEmps || []).filter(e => e.nombre?.toLowerCase().includes(args.nombre_usuario?.toLowerCase())).slice(0, 1);",
        content
    )

    with open(f, 'w') as file:
        file.write(content)

