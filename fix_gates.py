with open('src/components/KanbanBoard/KanbanBoard.jsx', 'r') as f:
    content = f.read()

old_gates = """        // OTHER GATES
        const origenGlobalIdx = estados.indexOf(estadoOrigenReal);
        const destinoGlobalIdx = estados.indexOf(activeColumn);

        if (destinoGlobalIdx > origenGlobalIdx) {"""

new_gates = """        // OTHER GATES
        const origenGlobalIdx = estados.indexOf(estadoOrigenReal);
        const destinoGlobalIdx = estados.indexOf(activeColumn);
        const isSpecialDest = activeColumn.toLowerCase().includes('espera') || activeColumn.toLowerCase().includes('pausa') || activeColumn === 'Archivado' || activeColumn === 'Cancelado';

        if (destinoGlobalIdx > origenGlobalIdx && !isSpecialDest) {"""

content = content.replace(old_gates, new_gates)
with open('src/components/KanbanBoard/KanbanBoard.jsx', 'w') as f:
    f.write(content)
