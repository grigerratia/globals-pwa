import re

with open('src/components/Modals/ProjectDetailModal.jsx', 'r') as f:
    content = f.read()

# Make it discrete popup
new_cancel_logic = """  const handleCancelProject = async () => {
    if (!cancelMotive.trim()) {
      setMsg({ text: 'Debes ingresar un motivo de cancelación', type: 'error' });
      setTimeout(() => setMsg({ text: '', type: '' }), 3000);
      return;
    }
    const { error } = await supabase.from('proyectos').update({ estado: 'Cancelado', motivo_cancelacion: cancelMotive }).eq('id', proyectoId);
    if (!error) {
      logAudit(session, 'Canceló proyecto', { proyecto_id: proyectoId, titulo: proyecto.titulo, motivo: cancelMotive });
      onProjectDeleted(proyectoId);
      onClose();
    } else {
      console.error("Error al cancelar:", error);
      setMsg({ text: 'Error al cancelar: ' + error.message, type: 'error' });
      setTimeout(() => setMsg({ text: '', type: '' }), 5000);
    }
  };"""

content = re.sub(r'  const handleCancelProject = async \(\) => \{.*?\n  \};', new_cancel_logic.strip(), content, flags=re.DOTALL)

old_button_render = """            {['Líder Comercial', 'Administrador', 'Administración', 'CEO'].includes(userRole) && (
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

new_button_render = """            {['Líder Comercial', 'Administrador', 'Administración', 'CEO'].includes(userRole) && (
              <button className={`${styles.actionButton} ${styles.danger}`} onClick={() => setConfirmDelete(true)}>
                <Trash2 size={16} /> Cancelar Proyecto
              </button>
            )}"""

content = content.replace(old_button_render, new_button_render)

# Add the popup at the end before final closing div
cancel_modal = """
      {confirmDelete && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999 }}>
          <div style={{ background: '#1e293b', padding: '2rem', borderRadius: '12px', width: '90%', maxWidth: '400px', boxShadow: '0 10px 25px rgba(0,0,0,0.5)', border: '1px solid rgba(255,255,255,0.1)' }}>
            <h3 style={{ marginTop: 0, color: '#f8fafc', fontSize: '1.2rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <XCircle size={20} color="#ef4444" /> Cancelar Proyecto
            </h3>
            <p style={{ color: '#94a3b8', fontSize: '0.9rem', marginBottom: '1rem' }}>Por favor, ingresa el motivo de la cancelación. Este dato será analizado por la IA para estadísticas futuras.</p>
            <textarea 
              value={cancelMotive} 
              onChange={(e) => setCancelMotive(e.target.value)}
              placeholder="Ej: El cliente no tiene presupuesto, el cliente desapareció..."
              style={{ width: '100%', padding: '0.75rem', borderRadius: '6px', border: '1px solid #334155', marginBottom: '1.5rem', background: '#0f172a', color: 'white', resize: 'vertical', minHeight: '80px', fontFamily: 'inherit' }}
            />
            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
              <button onClick={() => setConfirmDelete(false)} style={{ padding: '0.5rem 1rem', background: 'transparent', color: '#94a3b8', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 500 }}>Volver</button>
              <button onClick={handleCancelProject} disabled={!cancelMotive.trim()} style={{ padding: '0.5rem 1rem', background: cancelMotive.trim() ? '#ef4444' : '#7f1d1d', color: 'white', border: 'none', borderRadius: '6px', cursor: cancelMotive.trim() ? 'pointer' : 'not-allowed', fontWeight: 500, transition: 'background 0.2s' }}>Confirmar</button>
            </div>
          </div>
        </div>
      )}
"""

content = content.replace("    </div>\n  );\n}", cancel_modal + "    </div>\n  );\n}")

with open('src/components/Modals/ProjectDetailModal.jsx', 'w') as f:
    f.write(content)
