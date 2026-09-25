with open('src/components/KanbanBoard/KanbanBoard.jsx', 'r') as f:
    content = f.read()

import re

old_logic = "if (cambioDeFase && (activeColumn.toLowerCase().includes('espera') || activeColumn.toLowerCase().includes('pausa') || activeColumn === 'Archivado') && estadoOrigenReal !== 'Entregado y cerrado') {"

new_logic = """console.log("Checking if modal should open:", { cambioDeFase, activeColumn, estadoOrigenReal });
      if (cambioDeFase && (activeColumn.toLowerCase().includes('espera') || activeColumn.toLowerCase().includes('pausa') || activeColumn === 'Archivado') && estadoOrigenReal !== 'Entregado y cerrado') {"""

content = content.replace(old_logic, new_logic)
with open('src/components/KanbanBoard/KanbanBoard.jsx', 'w') as f:
    f.write(content)
