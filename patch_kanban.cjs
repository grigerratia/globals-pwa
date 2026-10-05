const fs = require('fs');
const file = 'src/components/KanbanBoard/KanbanBoard.jsx';
let content = fs.readFileSync(file, 'utf8');

const regex = /const destColumn = columnWhereLanded\.estadoOriginal;\s+const pry = columnasRef\.current\.flatMap\(c => c\.proyectos\)\.find\(p => p\.id === active\.id\);\s+const validation = validateProjectMove\(pry, destColumn, estados, session\);\s+if \(!validation\.isValid\) \{\s+showError\(validation\.error\);\s+if \(originalColumnasRef\.current\) setColumnas\(originalColumnasRef\.current\);\s+return;\s+\}\s+const cambioDeFase = pry\.estado !== destColumn;/;

const replacement = `const destColumn = columnWhereLanded.estadoOriginal;
      const pry = columnasRef.current.flatMap(c => c.proyectos).find(p => p.id === active.id);
      
      const pryOriginal = { ...pry, estado: estadoOrigenReal };
      const validation = validateProjectMove(pryOriginal, destColumn, estados, session);
      
      if (!validation.isValid) {
        showError(validation.error);
        if (originalColumnasRef.current) setColumnas(originalColumnasRef.current);
        return;
      }
      
      const cambioDeFase = estadoOrigenReal !== destColumn;

      const executeMove = async (motive = null, nuevasNotas = null) => {
        const colIndex = columnasRef.current.findIndex(c => c.estadoOriginal === destColumn);
        if (colIndex === -1) return;
        
        const proyectosFinales = columnasRef.current[colIndex].proyectos.map((p, i) => {
          let updated = { ...p, orden: i, estado: destColumn };
          if (p.id === active.id && cambioDeFase) {
            updated.dias = 0;
            updated.fecha_ultima_actualizacion = new Date().toISOString();
            if (motive) updated.motivo_cancelacion = motive;
            if (nuevasNotas) updated.notas = nuevasNotas;
          }
          return updated;
        });

        setColumnas(prev => {
          const nuevas = prev.map(c => ({ ...c, proyectos: [...c.proyectos] }));
          nuevas[colIndex].proyectos = proyectosFinales;
          return nuevas;
        });

        (async () => {
          for (const p of proyectosFinales) {
            const updateData = { orden: p.orden, estado: p.estado };
            if (p.id === active.id && cambioDeFase) {
              updateData.fecha_ultima_actualizacion = p.fecha_ultima_actualizacion;
              if (motive) updateData.motivo_cancelacion = motive;
              if (nuevasNotas) updateData.notas = nuevasNotas;

              logAudit(session, 'Movió proyecto de fase', { 
                proyecto_id: p.id, 
                titulo: p.titulo, 
                nuevo_estado: destColumn, 
                origen: estadoOrigenReal, 
                motivo: motive 
              });
            }
            await supabase.from('proyectos').update(updateData).eq('id', p.id);
          }
        })();
      };`;

if (content.match(regex)) {
  content = content.replace(regex, replacement);
  fs.writeFileSync(file, content);
  console.log("Patched successfully.");
} else {
  console.error("Regex did not match.");
}
