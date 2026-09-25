import re

# KanbanBoard.jsx
with open('src/components/KanbanBoard/KanbanBoard.jsx', 'r') as f:
    kanban = f.read()

# Replace session check
kanban = re.sub(
    r"session\?\.user\?\.user_metadata\?\.rol === 'Líder Comercial'",
    r"(session?.user?.user_metadata?.rol === 'Líder Comercial' || session?.user?.user_metadata?.rol === 'Líder de Operaciones')",
    kanban
)
kanban = re.sub(
    r"session\?\.user\?\.user_metadata\?\.rol !== 'Líder Comercial'",
    r"(session?.user?.user_metadata?.rol !== 'Líder Comercial' && session?.user?.user_metadata?.rol !== 'Líder de Operaciones')",
    kanban
)

with open('src/components/KanbanBoard/KanbanBoard.jsx', 'w') as f:
    f.write(kanban)


# ProjectDetailModal.jsx
with open('src/components/Modals/ProjectDetailModal.jsx', 'r') as f:
    modal = f.read()

modal = re.sub(
    r"userRole === 'Líder Comercial'",
    r"(userRole === 'Líder Comercial' || userRole === 'Líder de Operaciones')",
    modal
)

with open('src/components/Modals/ProjectDetailModal.jsx', 'w') as f:
    f.write(modal)

# AssignEmployeeSelect.jsx
with open('src/components/Modals/AssignEmployeeSelect.jsx', 'r') as f:
    assign = f.read()

assign = assign.replace('"Líder Comercial", "Ventas",', '"Líder Comercial", "Líder de Operaciones", "Ventas",')

with open('src/components/Modals/AssignEmployeeSelect.jsx', 'w') as f:
    f.write(assign)

# Login.jsx
with open('src/components/Auth/Login.jsx', 'r') as f:
    login = f.read()

login = login.replace('<option value="Líder Comercial">Líder Comercial</option>', '<option value="Líder Comercial">Líder Comercial</option>\n                  <option value="Líder de Operaciones">Líder de Operaciones</option>')

with open('src/components/Auth/Login.jsx', 'w') as f:
    f.write(login)

print("Roles updated")
