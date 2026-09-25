with open('src/components/KanbanBoard/KanbanBoard.jsx', 'r') as f:
    content = f.read()

# 1. Remove the definitions at line 531
old_def = """      const origenGlobalIdx = estados.indexOf(estadoOrigenReal);
      const destinoGlobalIdx = estados.indexOf(activeColumn);
      const isSpecialDest = activeColumn.toLowerCase().includes('espera') || activeColumn.toLowerCase().includes('pausa') || activeColumn === 'Archivado' || activeColumn === 'Cancelado';
      
      const isRetroceso = cambioDeFase && (destinoGlobalIdx < origenGlobalIdx) && !isSpecialDest;"""

new_def = """      const isRetroceso = cambioDeFase && (destinoGlobalIdx < origenGlobalIdx) && !isSpecialDest;"""

content = content.replace(old_def, new_def)


# 2. Add them at the top of type === 'Card'
old_top = """      if (!activeColumn || !overColumn) return;

      const cambioDeFase = estadoOrigenReal !== activeColumn;"""

new_top = """      if (!activeColumn || !overColumn) return;

      const origenGlobalIdx = estados.indexOf(estadoOrigenReal);
      const destinoGlobalIdx = estados.indexOf(activeColumn);
      const isSpecialDest = activeColumn.toLowerCase().includes('espera') || activeColumn.toLowerCase().includes('pausa') || activeColumn === 'Archivado' || activeColumn === 'Cancelado';

      const cambioDeFase = estadoOrigenReal !== activeColumn;"""

content = content.replace(old_top, new_top)

with open('src/components/KanbanBoard/KanbanBoard.jsx', 'w') as f:
    f.write(content)
