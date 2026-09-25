with open('src/components/Modals/ProjectDetailModal.jsx', 'r') as f:
    content = f.read()

archive_fn = """  const handleArchiveProject = async () => {
    if (!archiveMotive.trim()) return;
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

content = content.replace("const handleCancelProject = async () => {", archive_fn + "\n  const handleCancelProject = async () => {")

with open('src/components/Modals/ProjectDetailModal.jsx', 'w') as f:
    f.write(content)
