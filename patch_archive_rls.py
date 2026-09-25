with open('src/components/Modals/ProjectDetailModal.jsx', 'r') as f:
    content = f.read()

archive_fn = """  const handleArchiveProject = async () => {
    if (!archiveMotive.trim()) return;
    
    // Check if column exists, create if not
    const { data: colData } = await supabase.from('columnas').select('nombre').eq('nombre', 'Archivado').single();
    if (!colData) {
      await supabase.from('columnas').insert([{ nombre: 'Archivado', orden: 98 }]);
    }
    
    const { error } = await supabase.from('proyectos').update({ estado: 'Archivado', motivo_cancelacion: archiveMotive }).eq('id', proyectoId);
    if (!error) {
      logAudit(session, 'Archivó proyecto', { proyecto_id: proyectoId, titulo: proyecto.titulo, motivo: archiveMotive });
      onProjectUpdated({ ...proyecto, estado: 'Archivado', motivo_cancelacion: archiveMotive });
      onClose();
    } else {
      setConfirmArchive(false);
      setMsg({ text: 'Error al archivar: ' + error.message, type: 'error' });
      setTimeout(() => setMsg({ text: '', type: '' }), 5000);
    }
  };
"""

import re
content = re.sub(r'  const handleArchiveProject = async \(\) => \{[\s\S]*?  \};\n', archive_fn, content)

with open('src/components/Modals/ProjectDetailModal.jsx', 'w') as f:
    f.write(content)
