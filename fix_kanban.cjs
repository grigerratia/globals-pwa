const fs = require('fs');
const file = 'src/components/KanbanBoard/KanbanBoard.jsx';
let content = fs.readFileSync(file, 'utf-8');

if (!content.includes('const [isSaving, setIsSaving] = useState(false);')) {
  content = content.replace('const [columnaActiva, setColumnaActiva] = useState(null);', 'const [columnaActiva, setColumnaActiva] = useState(null);\n  const [isSaving, setIsSaving] = useState(false);');
}

// Modify executeMove to use setIsSaving and await logAudit
content = content.replace(/\(async \(\) => \{\n\s*for \(const p of proyectosFinales\) \{([\s\S]*?)const \{error: err\} = await supabase\.from\('proyectos'\)\.update\(updateData\)\.eq\('id', p\.id\); if\(err\) \{ console\.error\("Error update proy:", err\); alert\("Error guardando proyecto: " \+ err\.message\); \}\n\s*\}\n\s*\}\)\(\);/g, `
        setIsSaving(true);
        try {
          for (const p of proyectosFinales) {
            const updateData = { orden: p.orden, estado: p.estado };
            if (p.id === active.id && cambioDeFase) {
              updateData.fecha_ultima_actualizacion = p.fecha_ultima_actualizacion;
              if (motive) updateData.motivo_cancelacion = motive;
              if (nuevasNotas) updateData.notas = nuevasNotas;

              await logAudit(session, 'Movió proyecto de fase', { 
                proyecto_id: p.id, 
                titulo: p.titulo, 
                nuevo_estado: destColumn, 
                origen: estadoOrigenReal, 
                motivo: motive 
              });
            }
            const {error: err} = await supabase.from('proyectos').update(updateData).eq('id', p.id); 
            if(err) { console.error("Error update proy:", err); alert("Error guardando proyecto: " + err.message); }
          }
        } finally {
          setIsSaving(false);
        }
`);

// Add the overlay in JSX
if (!content.includes('isSaving && <div className={styles.savingOverlay}')) {
  content = content.replace('<div className={styles.boardContainer}>', '<div className={styles.boardContainer}>\n      {isSaving && <div className={styles.savingOverlay}>Guardando cambios...</div>}');
}

fs.writeFileSync(file, content);
console.log('Fixed KanbanBoard');
