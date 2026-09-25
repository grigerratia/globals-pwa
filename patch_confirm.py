import re

with open('src/components/Modals/CanceladosModal.jsx', 'r') as f:
    content = f.read()

content = content.replace("const [msg, setMsg] = useState({ text: '', type: '' });", "const [msg, setMsg] = useState({ text: '', type: '' });\n  const [confirmAction, setConfirmAction] = useState(null);")

delete_selected_old = """  const handleDeleteSelected = async () => {
    if (selectedIds.size === 0) return;
    const confirm = window.confirm(`¿Estás seguro de eliminar permanentemente ${selectedIds.size} proyectos? Esta acción no se puede deshacer.`);
    if (!confirm) return;

    const idsToDelete = Array.from(selectedIds);
    const { error } = await supabase.from('proyectos').delete().in('id', idsToDelete);

    if (!error) {
      logAudit(session, 'Eliminó proyectos cancelados permanentemente', { ids: idsToDelete });
      setMsg({ text: 'Proyectos eliminados correctamente', type: 'success' });
      setSelectedIds(new Set());
      fetchCancelados();
    } else {
      setMsg({ text: 'Error al eliminar: ' + error.message, type: 'error' });
    }
    setTimeout(() => setMsg({ text: '', type: '' }), 3000);
  };"""

delete_selected_new = """  const executeDeleteBulk = async (idsToDelete) => {
    const { error } = await supabase.from('proyectos').delete().in('id', idsToDelete);
    if (!error) {
      logAudit(session, 'Eliminó proyectos cancelados permanentemente', { ids: idsToDelete });
      setMsg({ text: 'Proyectos eliminados correctamente', type: 'success' });
      setSelectedIds(new Set());
      fetchCancelados();
    } else {
      setMsg({ text: 'Error al eliminar: ' + error.message, type: 'error' });
    }
    setTimeout(() => setMsg({ text: '', type: '' }), 3000);
  };

  const handleDeleteSelected = () => {
    if (selectedIds.size === 0) return;
    setConfirmAction({
      type: 'bulk',
      text: `¿Estás seguro de eliminar permanentemente ${selectedIds.size} proyectos? Esta acción no se puede deshacer.`,
      action: () => executeDeleteBulk(Array.from(selectedIds))
    });
  };"""

content = content.replace(delete_selected_old, delete_selected_new)

delete_single_old = """  const handleDeleteSingle = async (id, titulo) => {
    const confirm = window.confirm(`¿Eliminar permanentemente el proyecto "${titulo}"?`);
    if (!confirm) return;

    const { error } = await supabase.from('proyectos').delete().eq('id', id);
    if (!error) {
      logAudit(session, 'Eliminó proyecto cancelado permanentemente', { id, titulo });
      fetchCancelados();
    } else {
      setMsg({ text: 'Error: ' + error.message, type: 'error' });
      setTimeout(() => setMsg({ text: '', type: '' }), 3000);
    }
  };"""

delete_single_new = """  const executeDeleteSingle = async (id, titulo) => {
    const { error } = await supabase.from('proyectos').delete().eq('id', id);
    if (!error) {
      logAudit(session, 'Eliminó proyecto cancelado permanentemente', { id, titulo });
      fetchCancelados();
    } else {
      setMsg({ text: 'Error: ' + error.message, type: 'error' });
      setTimeout(() => setMsg({ text: '', type: '' }), 3000);
    }
  };

  const handleDeleteSingle = (id, titulo) => {
    setConfirmAction({
      type: 'single',
      text: `¿Eliminar permanentemente el proyecto "${titulo}"? Esta acción no se puede deshacer.`,
      action: () => executeDeleteSingle(id, titulo)
    });
  };"""

content = content.replace(delete_single_old, delete_single_new)

# Add popup UI
popup_ui = """      </div>

      {confirmAction && (
        <div onClick={(e) => { e.stopPropagation(); setConfirmAction(null); }} style={{ position: 'fixed', top: 0, left: 0, inset: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999 }}>
          <div onClick={(e) => e.stopPropagation()} style={{ background: '#1e293b', padding: '2rem', borderRadius: '12px', width: '90%', maxWidth: '400px', boxShadow: '0 10px 25px rgba(0,0,0,0.5)', border: '1px solid rgba(255,255,255,0.1)' }}>
            <h3 style={{ marginTop: 0, color: '#f8fafc', fontSize: '1.2rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Trash2 size={20} color="#ef4444" /> Eliminar Definitivamente
            </h3>
            <p style={{ color: '#94a3b8', fontSize: '0.95rem', marginBottom: '1.5rem', lineHeight: '1.4' }}>
              {confirmAction.text}
            </p>
            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
              <button onClick={() => setConfirmAction(null)} style={{ padding: '0.5rem 1rem', background: 'transparent', color: '#94a3b8', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 500 }}>Cancelar</button>
              <button onClick={() => { confirmAction.action(); setConfirmAction(null); }} style={{ padding: '0.5rem 1rem', background: '#ef4444', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 500, transition: 'background 0.2s' }}>Sí, Eliminar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}"""

content = content.replace("      </div>\n    </div>\n  );\n}", popup_ui)

with open('src/components/Modals/CanceladosModal.jsx', 'w') as f:
    f.write(content)
