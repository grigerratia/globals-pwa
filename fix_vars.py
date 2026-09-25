with open('src/components/KanbanBoard/KanbanBoard.jsx', 'r') as f:
    content = f.read()

import re

old_str = """      let cambioDeFase = false;
      if (estadoOrigenReal !== activeColumn) {"""

new_str = """      let cambioDeFase = false;
      const origenGlobalIdx = estados.indexOf(estadoOrigenReal);
      const destinoGlobalIdx = estados.indexOf(activeColumn);
      const isSpecialDest = activeColumn.toLowerCase().includes('espera') || activeColumn.toLowerCase().includes('pausa') || activeColumn === 'Archivado' || activeColumn === 'Cancelado';

      if (estadoOrigenReal !== activeColumn) {"""

content = content.replace(old_str, new_str)
with open('src/components/KanbanBoard/KanbanBoard.jsx', 'w') as f:
    f.write(content)
