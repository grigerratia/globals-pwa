with open('src/components/KanbanBoard/KanbanBoard.jsx', 'r') as f:
    content = f.read()

import re

old_logic = """    const targetIdx = estados.indexOf(nuevoProyectoData.estado);
    const levantamientoIdx = estados.indexOf('Levantamiento');"""

new_logic = """    // Días estimados por defecto o manual
    const dias = nuevoProyectoData.diasEstimados || 3;
    let cleanNotas = (nuevoProyectoData.notas || '').replace(/\\[DÍAS ESTIMADOS FASE ACTUAL: \\d+\\]\\n?/g, '').trim();
    nuevoProyectoData.notas = cleanNotas ? cleanNotas + '\\n\\n[DÍAS ESTIMADOS FASE ACTUAL: ' + dias + ']' : '[DÍAS ESTIMADOS FASE ACTUAL: ' + dias + ']';
    delete nuevoProyectoData.diasEstimados;

    const targetIdx = estados.indexOf(nuevoProyectoData.estado);
    const levantamientoIdx = estados.indexOf('Levantamiento');"""

content = content.replace(old_logic, new_logic)

with open('src/components/KanbanBoard/KanbanBoard.jsx', 'w') as f:
    f.write(content)
