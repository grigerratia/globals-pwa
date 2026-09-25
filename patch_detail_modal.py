import re

with open('src/components/Modals/ProjectDetailModal.jsx', 'r') as f:
    content = f.read()

# 1. Add state for Archive Confirm
content = content.replace("const [confirmDelete, setConfirmDelete] = useState(false);", "const [confirmDelete, setConfirmDelete] = useState(false);\n  const [confirmArchive, setConfirmArchive] = useState(false);\n  const [archiveMotive, setArchiveMotive] = useState('');")

# 2. Add handleArchiveProject function
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
content = content.replace("  const handleCancelProject = async () => {", archive_fn + "\n  const handleCancelProject = async () => {")

# 3. Modify "Archivar Proyecto" button to open modal instead of executing directly
old_archive_btn = """            {proyecto.estado !== 'Archivado' && userRole === 'Líder Comercial' && (
              <button 
                className={`${styles.actionButton} ${styles.warning}`} 
                onClick={async () => {
                  await handleChange('estado', 'Archivado');
                  onProjectUpdated({ ...proyecto, estado: 'Archivado' });
                  onClose();
                }}
                style={{ background: '#fef3c7', color: '#d97706', borderColor: '#fde68a', marginBottom: '0' }}
              >
                <Archive size={16} /> Archivar Proyecto
              </button>
            )}"""

new_archive_btn = """            {proyecto.estado !== 'Archivado' && userRole === 'Líder Comercial' && (
              <button 
                className={`${styles.actionButton} ${styles.warning}`} 
                onClick={() => setConfirmArchive(true)}
                style={{ background: '#fef3c7', color: '#d97706', borderColor: '#fde68a', marginBottom: '0' }}
              >
                <Archive size={16} /> Archivar Proyecto
              </button>
            )}"""
content = content.replace(old_archive_btn, new_archive_btn)

# 4. Add the Archive modal UI
archive_ui = """
      {confirmArchive && (
        <div onClick={(e) => { e.stopPropagation(); setConfirmArchive(false); }} style={{ position: 'fixed', top: 0, left: 0, inset: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999 }}>
          <div onClick={(e) => e.stopPropagation()} style={{ background: '#1e293b', padding: '2rem', borderRadius: '12px', width: '90%', maxWidth: '400px', boxShadow: '0 10px 25px rgba(0,0,0,0.5)', border: '1px solid rgba(255,255,255,0.1)' }}>
            <h3 style={{ marginTop: 0, color: '#f8fafc', fontSize: '1.2rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Archive size={20} color="#d97706" /> Motivo de Archivo
            </h3>
            <p style={{ color: '#94a3b8', fontSize: '0.95rem', marginBottom: '1rem', lineHeight: '1.4' }}>
              Por favor, indica el motivo por el cual se archiva este proyecto.
            </p>
            <textarea 
              autoFocus
              value={archiveMotive}
              onChange={(e) => setArchiveMotive(e.target.value)}
              placeholder="Ej: Cliente pospuso para el próximo año..."
              style={{ width: '100%', padding: '0.75rem', borderRadius: '6px', border: '1px solid #334155', marginBottom: '1.5rem', background: '#0f172a', color: 'white', resize: 'vertical', minHeight: '80px', fontFamily: 'inherit' }}
            />
            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
              <button onClick={() => setConfirmArchive(false)} style={{ padding: '0.5rem 1rem', background: 'transparent', color: '#94a3b8', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 500 }}>Volver</button>
              <button onClick={handleArchiveProject} disabled={!archiveMotive.trim()} style={{ padding: '0.5rem 1rem', background: archiveMotive.trim() ? '#d97706' : '#92400e', color: 'white', border: 'none', borderRadius: '6px', cursor: archiveMotive.trim() ? 'pointer' : 'not-allowed', fontWeight: 500, transition: 'background 0.2s' }}>Confirmar</button>
            </div>
          </div>
        </div>
      )}

      {confirmDelete && ("""
content = content.replace("      {confirmDelete && (", archive_ui)

# 5. Display the motive if paused or archived
motive_display = """
            <p className={styles.subtitle}>
              en la lista <strong>{proyecto.estado}</strong>
            </p>

            {(proyecto.estado?.toLowerCase().includes('espera') || proyecto.estado?.toLowerCase().includes('pausa') || proyecto.estado === 'Archivado') && proyecto.motivo_cancelacion && (
               <div style={{ marginTop: '1rem', padding: '1rem', background: '#334155', borderRadius: '8px', borderLeft: '4px solid #3b82f6' }}>
                 <p style={{ margin: 0, fontSize: '0.85rem', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Motivo ({proyecto.estado}):</p>
                 <p style={{ margin: '0.25rem 0 0 0', color: '#f8fafc', fontStyle: 'italic' }}>"{proyecto.motivo_cancelacion}"</p>
               </div>
            )}
"""

old_title_section = """
            <p className={styles.subtitle}>
              en la lista <strong>{proyecto.estado}</strong>
            </p>
"""
content = content.replace(old_title_section, motive_display)

with open('src/components/Modals/ProjectDetailModal.jsx', 'w') as f:
    f.write(content)

