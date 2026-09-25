import { useState, useEffect } from 'react';
import { supabase } from '../../supabase';
import { X, Trash2, AlertTriangle, RefreshCcw } from 'lucide-react';
import styles from './CanceladosModal.module.scss';
import { logAudit } from '../../utils/audit';

export default function CanceladosModal({ onClose, session }) {
  const [cancelados, setCancelados] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [msg, setMsg] = useState({ text: '', type: '' });
  const [confirmAction, setConfirmAction] = useState(null);

  const fetchCancelados = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('proyectos')
      .select('*')
      .eq('estado', 'Cancelado')
      .order('fecha_ultima_actualizacion', { ascending: false });

    if (!error && data) {
      setCancelados(data);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchCancelados();
  }, []);

  const handleToggleSelect = (id) => {
    const newSelected = new Set(selectedIds);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedIds(newSelected);
  };

  const handleSelectAll = () => {
    if (selectedIds.size === cancelados.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(cancelados.map(p => p.id)));
    }
  };

  const executeDeleteBulk = async (idsToDelete) => {
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
  };

  const executeDeleteSingle = async (id, titulo) => {
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
  };
  
  const handleRestore = async (id, titulo) => {
    const { error } = await supabase.from('proyectos').update({ estado: 'Pendiente' }).eq('id', id);
    if (!error) {
      logAudit(session, 'Restauró proyecto cancelado', { id, titulo });
      setMsg({ text: 'Proyecto restaurado a "Pendiente"', type: 'success' });
      fetchCancelados();
      setTimeout(() => { window.location.reload(); }, 1500); // recarga para ver en kanban
    } else {
      setMsg({ text: 'Error al restaurar: ' + error.message, type: 'error' });
      setTimeout(() => setMsg({ text: '', type: '' }), 3000);
    }
  };

  return (
    <div className={styles.overlay}>
      <div className={styles.modal}>
        <div className={styles.header}>
          <h2>Proyectos Cancelados</h2>
          <button onClick={onClose} className={styles.closeBtn}><X size={20} /></button>
        </div>

        {msg.text && (
          <div className={`${styles.message} ${styles[msg.type]}`}>
            {msg.text}
          </div>
        )}

        <div className={styles.toolbar}>
          <div className={styles.selectInfo}>
            <input 
              type="checkbox" 
              checked={cancelados.length > 0 && selectedIds.size === cancelados.length}
              onChange={handleSelectAll}
              disabled={cancelados.length === 0}
            />
            <span>{selectedIds.size} seleccionados</span>
          </div>
          {selectedIds.size > 0 && (
            <button className={styles.btnDangerBulk} onClick={handleDeleteSelected}>
              <Trash2 size={16} /> Eliminar {selectedIds.size} Permanentemente
            </button>
          )}
        </div>

        <div className={styles.content}>
          {loading ? (
            <div className={styles.empty}>Cargando...</div>
          ) : cancelados.length === 0 ? (
            <div className={styles.empty}>
              <AlertTriangle size={32} opacity={0.5} style={{marginBottom:'1rem'}}/>
              <p>No hay proyectos cancelados.</p>
            </div>
          ) : (
            <table className={styles.table}>
              <thead>
                <tr>
                  <th width="40"></th>
                  <th>Proyecto</th>
                  <th>Cliente</th>
                  <th>Motivo de Cancelación</th>
                  <th width="100">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {cancelados.map(p => (
                  <tr key={p.id} className={selectedIds.has(p.id) ? styles.selectedRow : ''}>
                    <td>
                      <input 
                        type="checkbox" 
                        checked={selectedIds.has(p.id)} 
                        onChange={() => handleToggleSelect(p.id)} 
                      />
                    </td>
                    <td><strong>{p.titulo}</strong></td>
                    <td>{p.cliente_nombre || 'N/A'}</td>
                    <td className={styles.motivoText}>{p.motivo_cancelacion || 'Sin motivo'}</td>
                    <td>
                      <div className={styles.actionsBox}>
                        <button onClick={() => handleRestore(p.id, p.titulo)} title="Restaurar" className={styles.btnIconRes}>
                           <RefreshCcw size={16} />
                        </button>
                        <button onClick={() => handleDeleteSingle(p.id, p.titulo)} title="Eliminar" className={styles.btnIconDel}>
                           <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

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
}
