with open('src/components/KanbanBoard/KanbanBoard.jsx', 'r') as f:
    content = f.read()

import re

old_insert = """    setColumnas(prev => prev.map(c => {
      if (c.estadoOriginal === nuevoProyectoData.estado) {
        return { ...c, proyectos: [...c.proyectos, proyectoInsertado] };
      }
      return c;
    }));
    
    setAddProjectColumnId(null); // Cerrar modal
  };"""

new_insert = """    setColumnas(prev => prev.map(c => {
      if (c.estadoOriginal === nuevoProyectoData.estado) {
        return { ...c, proyectos: [...c.proyectos, proyectoInsertado] };
      }
      return c;
    }));
    
    setAddProjectColumnId(null); // Cerrar modal

    // Disparar generación de título en background
    generateTitleWithAI(nuevoProyectoData).then(async (aiTitle) => {
       const { error: updErr } = await supabase.from('proyectos').update({ titulo: aiTitle }).eq('id', proyectoInsertado.id);
       if (!updErr) {
         setColumnas(prevCols => prevCols.map(col => {
           if (col.estadoOriginal === proyectoInsertado.estado) {
             return {
               ...col,
               proyectos: col.proyectos.map(p => p.id === proyectoInsertado.id ? { ...p, titulo: aiTitle } : p)
             };
           }
           return col;
         }));
       }
    });
  };"""

content = content.replace(old_insert, new_insert)

# Also update the model to gemini-3.5-flash-lite
old_model = """const model = genAI.getGenerativeModel({ model: "gemini-3.8-flash" });"""
new_model = """const model = genAI.getGenerativeModel({ model: "gemini-3.5-flash-lite" });"""
content = content.replace(old_model, new_model)

with open('src/components/KanbanBoard/KanbanBoard.jsx', 'w') as f:
    f.write(content)
