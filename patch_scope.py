with open('src/components/KanbanBoard/KanbanBoard.jsx', 'r') as f:
    content = f.read()

import re

# We will move the definitions outside the `if (cambioDeFase)`
old_block1 = """      let cambioDeFase = false;
      if (estadoOrigenReal !== activeColumn) {
        cambioDeFase = true;

        // VALIDADOR DE LEVANTAMIENTO"""

new_block1 = """      let cambioDeFase = false;
      const origenGlobalIdx = estados.indexOf(estadoOrigenReal);
      const destinoGlobalIdx = estados.indexOf(activeColumn);
      const isSpecialDest = activeColumn.toLowerCase().includes('espera') || activeColumn.toLowerCase().includes('pausa') || activeColumn === 'Archivado' || activeColumn === 'Cancelado';

      if (estadoOrigenReal !== activeColumn) {
        cambioDeFase = true;

        // VALIDADOR DE LEVANTAMIENTO"""
content = content.replace(old_block1, new_block1)

old_block2 = """        // OTHER GATES
        const origenGlobalIdx = estados.indexOf(estadoOrigenReal);
        const destinoGlobalIdx = estados.indexOf(activeColumn);
        const isSpecialDest = activeColumn.toLowerCase().includes('espera') || activeColumn.toLowerCase().includes('pausa') || activeColumn === 'Archivado' || activeColumn === 'Cancelado';

        if (destinoGlobalIdx > origenGlobalIdx && !isSpecialDest) {"""

new_block2 = """        // OTHER GATES
        if (destinoGlobalIdx > origenGlobalIdx && !isSpecialDest) {"""
content = content.replace(old_block2, new_block2)

with open('src/components/KanbanBoard/KanbanBoard.jsx', 'w') as f:
    f.write(content)
