import re

with open('src/components/Modals/ProjectDetailModal.jsx', 'r') as f:
    content = f.read()

# Add Cancel motive state
state_declarations = "const [msg, setMsg] = useState({ text: '', type: '' });\n  const [confirmDelete, setConfirmDelete] = useState(false);\n  const [cancelMotive, setCancelMotive] = useState('');"
content = re.sub(r'const \[msg, setMsg\] = useState\(\{ text: \'\', type: \'\' \}\);\s*const \[confirmDelete, setConfirmDelete\] = useState\(false\);', state_declarations, content)

# Replace handleDelete with handleCancel
old_delete_logic = """  const handleDelete = async () => {
    const { error } = await supabase.from('proyectos').delete().eq('id', proyectoId);
    if (!error) {
      logAudit(session, 'Eliminó proyecto', { proyecto_id: proyectoId, titulo: proyecto.titulo });
      onProjectDeleted(proyectoId);
      onClose();
    } else {
      setMsg({ text: 'Error al eliminar', type: 'error' });
      setTimeout(() => setMsg({ text: '', type: '' }), 3000);
    }
  };"""

new_cancel_logic = """  const handleCancelProject = async () => {
    if (!cancelMotive.trim()) {
      setMsg({ text: 'Debes ingresar un motivo de cancelación', type: 'error' });
      setTimeout(() => setMsg({ text: '', type: '' }), 3000);
      return;
    }
    const { error } = await supabase.from('proyectos').update({ estado: 'Cancelado', motivo_cancelacion: cancelMotive }).eq('id', proyectoId);
    if (!error) {
      logAudit(session, 'Canceló proyecto', { proyecto_id: proyectoId, titulo: proyecto.titulo, motivo: cancelMotive });
      onProjectDeleted(proyectoId); // Mantenemos esta función para sacarlo del Kanban local
      onClose();
    } else {
      setMsg({ text: 'Error al cancelar', type: 'error' });
      setTimeout(() => setMsg({ text: '', type: '' }), 3000);
    }
  };"""

content = content.replace(old_delete_logic, new_cancel_logic)

# Replace the button rendering
old_button_render = """            {!confirmDelete ? (
              <button className={`${styles.actionButton} ${styles.danger}`} onClick={() => setConfirmDelete(true)}>
                <Trash2 size={16} /> Eliminar Proyecto
              </button>
            ) : (
              <div className={styles.confirmDeleteBox}>
                <p>¿Estás seguro de eliminar este proyecto?</p>
                <div className={styles.confirmActions}>
                  <button className={styles.btnCancel} onClick={() => setConfirmDelete(false)}>Cancelar</button>
                  <button className={styles.btnConfirm} onClick={handleDelete}>Sí, eliminar</button>
                </div>
              </div>
            )}"""

new_button_render = """            {['Líder Comercial', 'Administrador', 'Administración', 'CEO'].includes(userRole) && (
              !confirmDelete ? (
                <button className={`${styles.actionButton} ${styles.danger}`} onClick={() => setConfirmDelete(true)}>
                  <Trash2 size={16} /> Cancelar Proyecto
                </button>
              ) : (
                <div className={styles.confirmDeleteBox}>
                  <p>Por favor, ingresa el motivo de la cancelación:</p>
                  <textarea 
                    value={cancelMotive} 
                    onChange={(e) => setCancelMotive(e.target.value)}
                    placeholder="El cliente no tiene presupuesto, falta de interés, etc."
                    style={{ width: '100%', padding: '0.5rem', borderRadius: '4px', border: '1px solid #ccc', marginBottom: '0.5rem', background: '#333', color: 'white' }}
                    rows={3}
                  />
                  <div className={styles.confirmActions}>
                    <button className={styles.btnCancel} onClick={() => setConfirmDelete(false)}>Volver</button>
                    <button className={styles.btnConfirm} disabled={!cancelMotive.trim()} onClick={handleCancelProject}>Confirmar Cancelación</button>
                  </div>
                </div>
              )
            )}"""

content = content.replace(old_button_render, new_button_render)

with open('src/components/Modals/ProjectDetailModal.jsx', 'w') as f:
    f.write(content)
