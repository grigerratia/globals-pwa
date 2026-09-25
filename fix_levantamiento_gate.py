with open('src/components/KanbanBoard/KanbanBoard.jsx', 'r') as f:
    content = f.read()

import re

old_gate = """        // VALIDADOR DE LEVANTAMIENTO
        if (estadoOrigenReal === 'Levantamiento' && activeColumn !== 'Levantamiento') {"""

new_gate = """        // VALIDADOR DE LEVANTAMIENTO
        const isSpecialDestForLev = activeColumn.toLowerCase().includes('espera') || activeColumn.toLowerCase().includes('pausa') || activeColumn === 'Archivado' || activeColumn === 'Cancelado';
        if (estadoOrigenReal === 'Levantamiento' && activeColumn !== 'Levantamiento' && !isSpecialDestForLev) {"""

content = content.replace(old_gate, new_gate)
with open('src/components/KanbanBoard/KanbanBoard.jsx', 'w') as f:
    f.write(content)
