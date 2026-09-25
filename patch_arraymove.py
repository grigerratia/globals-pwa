with open('src/components/KanbanBoard/KanbanBoard.jsx', 'r') as f:
    content = f.read()

import re

old_exec = """      const executeMove = (motive = null, nuevasNotas = null) => {
        const nuevasColumnas = columnasRef.current.map(c => ({ ...c, proyectos: [...c.proyectos] }));
        const colIndex = nuevasColumnas.findIndex(c => c.estadoOriginal === activeColumn);
        const proyectosColumna = nuevasColumnas[colIndex].proyectos;
  
        const activeIndex = proyectosColumna.findIndex(p => p.id === active.id);
        const overIndex = proyectosColumna.findIndex(p => p.id === over.id);
  
        const proyectosReordenados = arrayMove(proyectosColumna, activeIndex, overIndex);
        nuevasColumnas[colIndex].proyectos = proyectosReordenados.map((p, i) => ({ ...p, orden: i, estado: activeColumn }));"""

new_exec = """      const executeMove = (motive = null, nuevasNotas = null) => {
        const nuevasColumnas = columnasRef.current.map(c => ({ ...c, proyectos: [...c.proyectos] }));
        const colIndex = nuevasColumnas.findIndex(c => c.estadoOriginal === activeColumn);
        const proyectosColumna = nuevasColumnas[colIndex].proyectos;
  
        let proyectosReordenados = proyectosColumna;
        if (!cambioDeFase) {
          const activeIndex = proyectosColumna.findIndex(p => p.id === active.id);
          let overIndex = proyectosColumna.findIndex(p => p.id === over.id);
          if (overIndex === -1) overIndex = proyectosColumna.length - 1;
          proyectosReordenados = arrayMove(proyectosColumna, activeIndex, overIndex);
        }
        
        nuevasColumnas[colIndex].proyectos = proyectosReordenados.map((p, i) => ({ ...p, orden: i, estado: activeColumn }));"""

content = content.replace(old_exec, new_exec)
with open('src/components/KanbanBoard/KanbanBoard.jsx', 'w') as f:
    f.write(content)
