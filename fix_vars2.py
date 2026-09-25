with open('src/components/KanbanBoard/KanbanBoard.jsx', 'r') as f:
    content = f.read()

import re

old_logic = """      const isRetroceso = cambioDeFase && (destinoGlobalIdx < origenGlobalIdx) && !isSpecialDest;
      if (cambioDeFase && (activeColumn.toLowerCase().includes('espera') || activeColumn.toLowerCase().includes('pausa') || activeColumn === 'Archivado') && estadoOrigenReal !== 'Entregado y cerrado') {"""

new_logic = """      const origenGlobalIdx = estados.indexOf(estadoOrigenReal);
      const destinoGlobalIdx = estados.indexOf(activeColumn);
      const isSpecialDest = activeColumn.toLowerCase().includes('espera') || activeColumn.toLowerCase().includes('pausa') || activeColumn === 'Archivado' || activeColumn === 'Cancelado';
      
      const isRetroceso = cambioDeFase && (destinoGlobalIdx < origenGlobalIdx) && !isSpecialDest;
      if (cambioDeFase && (activeColumn.toLowerCase().includes('espera') || activeColumn.toLowerCase().includes('pausa') || activeColumn === 'Archivado') && estadoOrigenReal !== 'Entregado y cerrado') {"""

content = content.replace(old_logic, new_logic)

with open('src/components/KanbanBoard/KanbanBoard.jsx', 'w') as f:
    f.write(content)
